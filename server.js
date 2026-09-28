require("dotenv").config();


const express = require("express");
const path = require("path");
const supabase = require("./supabase");
const multer = require("multer");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const upload =
    multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 25 * 1024 * 1024
        }
    });

app.use(express.static(path.join(__dirname)));

// =========================
// AUTENTICAÇÃO SUPABASE
// =========================

async function requireAuth(req, res, next) {
    try {
        const authorization = req.headers.authorization || "";
        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7).trim()
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Não autenticado"
            });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            return res.status(401).json({
                success: false,
                message: "Sessão inválida ou expirada"
            });
        }

        req.user = data.user;
        next();
    } catch (error) {
        console.error("Erro na autenticação:", error);
        return res.status(401).json({
            success: false,
            message: "Não autenticado"
        });
    }
}

app.use("/api", requireAuth);

function sanitizeFileName(fileName) {
    return String(fileName || "arquivo")
        .normalize("NFKC")
        .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180) || "arquivo";
}

function isValidPositiveInteger(value) {
    return Number.isInteger(Number(value)) && Number(value) > 0;
}

app.post(
    "/api/studies/files",
    upload.single("file"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Nenhum arquivo enviado"
                });
            }


            const subjectId =
                Number(req.body.subjectId);


            const title =
                req.body.title?.trim();


            if (!isValidPositiveInteger(subjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Matéria não informada"
                });
            }


            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: "Título não informado"
                });
            }


            // As matérias ainda são armazenadas localmente; o arquivo continua
            // isolado pelo user_id e pelo caminho privado do usuário.
            const safeOriginalName = sanitizeFileName(req.file.originalname);
            const fileName =
                `${Date.now()}-${safeOriginalName}`;

            const filePath =
                `users/${req.user.id}/studies/${fileName}`;


            const { data: uploadedFile, error: uploadError } =
                await supabase.storage
                    .from("study-files")
                    .upload(
                        filePath,
                        req.file.buffer,
                        {
                            contentType:
                                req.file.mimetype,
                            upsert: false
                        }
                    );


            if (uploadError) {

                console.error(
                    "Erro ao enviar arquivo:",
                    uploadError
                );

                return res.status(500).json({
                    success: false,
                    message: "Erro ao enviar arquivo"
                });

            }


            const { data: savedFile, error: databaseError } =
                await supabase
                    .from("study_files")
                    .insert({

                        subject_id: subjectId,

                        title: title,

                        file_name:
                            req.file.originalname,

                        file_path:
                            filePath,

                        file_type:
                            req.file.mimetype,

                        user_id:
                            req.user.id

                    })
                    .select()
                    .single();


            if (databaseError) {

                console.error(
                    "Erro ao salvar informações do arquivo:",
                    databaseError
                );


                await supabase.storage
                    .from("study-files")
                    .remove([
                        filePath
                    ]);


                return res.status(500).json({
                    success: false,
                    message:
                        "Arquivo enviado, mas não foi possível salvar suas informações"
                });

            }


            res.json({

                success: true,

                file: savedFile

            });

        } catch (error) {

            console.error(
                "Erro no upload:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Erro interno no servidor"
            });

        }

    }
);

app.get(
    "/api/studies/files/:subjectId",
    async (req, res) => {

        try {

            const subjectId =
                Number(req.params.subjectId);


            if (!subjectId) {
                return res.status(400).json({
                    success: false,
                    message: "Matéria não informada"
                });
            }


            const { data, error } =
                await supabase
                    .from("study_files")
                    .select("*")
                    .eq("subject_id", subjectId)
                    .eq("user_id", req.user.id)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(
                    "Erro ao buscar arquivos:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Erro ao buscar arquivos"
                });

            }


            res.json({
                success: true,
                files: data
            });

        } catch (error) {

            console.error(
                "Erro ao listar arquivos:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Erro interno no servidor"
            });

        }

    }
);

app.delete(
    "/api/studies/files/subject/:subjectId",
    async (req, res) => {
        try {
            const subjectId = Number(req.params.subjectId);

            if (!isValidPositiveInteger(subjectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Matéria inválida"
                });
            }

            const { data: files, error: listError } =
                await supabase
                    .from("study_files")
                    .select("id,file_path")
                    .eq("subject_id", subjectId)
                    .eq("user_id", req.user.id);

            if (listError) {
                console.error("Erro ao listar arquivos da matéria:", listError);
                return res.status(500).json({
                    success: false,
                    message: "Não foi possível remover os arquivos da matéria"
                });
            }

            const paths = (files || [])
                .map(file => file.file_path)
                .filter(Boolean);

            if (paths.length) {
                const { error: storageError } =
                    await supabase.storage
                        .from("study-files")
                        .remove(paths);

                if (storageError) {
                    console.error("Erro ao remover arquivos do Storage:", storageError);
                    return res.status(500).json({
                        success: false,
                        message: "Não foi possível remover os arquivos da matéria"
                    });
                }
            }

            const { error: deleteError } =
                await supabase
                    .from("study_files")
                    .delete()
                    .eq("subject_id", subjectId)
                    .eq("user_id", req.user.id);

            if (deleteError) {
                console.error("Erro ao remover registros da matéria:", deleteError);
                return res.status(500).json({
                    success: false,
                    message: "Os arquivos foram removidos, mas os registros não puderam ser excluídos"
                });
            }

            return res.json({
                success: true,
                removed: files?.length || 0
            });
        } catch (error) {
            console.error("Erro ao remover arquivos da matéria:", error);
            return res.status(500).json({
                success: false,
                message: "Erro interno ao remover arquivos da matéria"
            });
        }
    }
);

app.get(
    "/api/studies/file/:fileId",
    async (req, res) => {

        try {

            const fileId =
                req.params.fileId;


            const { data: file, error: databaseError } =
                await supabase
                    .from("study_files")
                    .select("file_path")
                    .eq("id", fileId)
                    .eq("user_id", req.user.id)
                    .single();


            if (databaseError || !file) {

                return res.status(404).json({
                    success: false,
                    message: "Arquivo não encontrado"
                });

            }


            const { data: signedUrl, error: urlError } =
                await supabase.storage
                    .from("study-files")
                    .createSignedUrl(
                        file.file_path,
                        60 * 60
                    );


            if (urlError) {

                console.error(
                    "Erro ao gerar URL:",
                    urlError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Não foi possível abrir o arquivo"
                });

            }


            res.json({
                success: true,
                url: signedUrl.signedUrl
            });

        } catch (error) {

            console.error(
                "Erro ao abrir arquivo:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Erro interno no servidor"
            });

        }

    }
);

app.delete(
    "/api/studies/file/:fileId",
    async (req, res) => {

        try {

            const fileId =
                req.params.fileId;


            const { data: file, error: databaseError } =
                await supabase
                    .from("study_files")
                    .select("file_path")
                    .eq("id", fileId)
                    .eq("user_id", req.user.id)
                    .single();


            if (databaseError || !file) {

                return res.status(404).json({
                    success: false,
                    message: "Arquivo não encontrado"
                });

            }


            const { error: storageError } =
                await supabase.storage
                    .from("study-files")
                    .remove([
                        file.file_path
                    ]);


            if (storageError) {

                console.error(
                    "Erro ao remover arquivo do Storage:",
                    storageError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Não foi possível remover o arquivo"
                });

            }


            const { error: deleteError } =
                await supabase
                    .from("study_files")
                    .delete()
                    .eq("id", fileId)
                    .eq("user_id", req.user.id);


            if (deleteError) {

                console.error(
                    "Erro ao remover registro:",
                    deleteError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Arquivo removido, mas o registro não pôde ser excluído"
                });

            }


            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "Erro ao remover arquivo:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Erro interno no servidor"
            });

        }

    }
);

app.get("/api/steam/games", async (req, res) => {

    try {

        const steamId = String(req.query.steamId || "").trim();

        if (!/^\d{17}$/.test(steamId)) {
            return res.status(400).json({
                success: false,
                message: "Steam ID não informado"
            });
        }

        const url =
            `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
            `?key=${process.env.STEAM_API_KEY}` +
            `&steamid=${steamId}` +
            `&include_appinfo=true` +
            `&include_played_free_games=true`;

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Steam respondeu com status ${response.status}`
            );
        }

        const data =
            await response.json();

        res.json({
            success: true,
            data: data.response
        });

    } catch (error) {

        console.error(
            "Erro ao buscar jogos da Steam:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Não foi possível buscar os jogos da Steam"
        });

    }

});

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "ORBIT backend funcionando"
    });
});

// =========================
// STEAM ID DO USUÁRIO
// =========================

app.get("/api/user/steam-id", async (req, res) => {

    try {

        const { data, error } =
            await supabase
                .from("user_settings")
                .select("steam_id")
                .eq("user_id", req.user.id)
                .limit(1)
                .maybeSingle();

        if (error) {
            console.error(
                "Erro ao buscar Steam ID:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Não foi possível buscar o Steam ID"
            });
        }

        res.json({
            success: true,
            steamId: data?.steam_id || null
        });

    } catch (error) {

        console.error(
            "Erro ao buscar Steam ID:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno no servidor"
        });

    }

});


app.post("/api/user/steam-id", async (req, res) => {

    try {

        const steamId =
            req.body?.steamId?.trim();

        if (!/^\d{17}$/.test(steamId || "")) {
            return res.status(400).json({
                success: false,
                message: "Steam ID não informado"
            });
        }

        const { data: existing, error: searchError } =
            await supabase
                .from("user_settings")
                .select("id")
                .eq("user_id", req.user.id)
                .limit(1)
                .maybeSingle();

        if (searchError) {
            console.error(
                "Erro ao verificar Steam ID:",
                searchError
            );

            return res.status(500).json({
                success: false,
                message: "Não foi possível salvar o Steam ID"
            });
        }

        let data;
        let error;

        if (existing) {

            const result =
                await supabase
                    .from("user_settings")
                    .update({
                        steam_id: steamId
                    })
                    .eq("id", existing.id)
                    .eq("user_id", req.user.id)
                    .select()
                    .single();

            data = result.data;
            error = result.error;

        } else {

            const result =
                await supabase
                    .from("user_settings")
                    .insert({
                        steam_id: steamId,
                        user_id: req.user.id
                    })
                    .select()
                    .single();

            data = result.data;
            error = result.error;

        }

        if (error) {
            console.error(
                "Erro ao salvar Steam ID:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Não foi possível salvar o Steam ID"
            });
        }

        res.json({
            success: true,
            steamId: data.steam_id
        });

    } catch (error) {

        console.error(
            "Erro ao salvar Steam ID:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno no servidor"
        });

    }

});

// =========================
// BIBLIOTECA DE FILMES,
// SÉRIES E ANIMES
// =========================

app.get("/api/media/:type", async (req, res) => {

    try {

        const type = req.params.type;

        if (
            !["movie", "series", "anime"].includes(type)
        ) {
            return res.status(400).json({
                success: false,
                message: "Tipo de mídia inválido"
            });
        }


        const { data, error } =
            await supabase
                .from("media_library")
                .select("*")
                .eq("type", type)
                .eq("user_id", req.user.id)
                .order("created_at", {
                    ascending: false
                });


        if (error) {

            console.error(
                "Erro ao buscar biblioteca:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Não foi possível carregar a biblioteca"
            });

        }


        res.json({
            success: true,
            media: data
        });


    } catch (error) {

        console.error(
            "Erro ao buscar biblioteca:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno no servidor"
        });

    }

});


// =========================
// SALVAR / ATUALIZAR MÍDIA
// =========================

app.post("/api/media", async (req, res) => {

    try {

        const {
            tmdbId,
            type,
            title,
            posterPath,
            releaseDate,
            voteAverage,
            status,
            favorite,
            seasonNumber,
            episodeNumber
        } = req.body;


        if (
            !tmdbId ||
            !["movie", "series", "anime"].includes(type) ||
            !title
        ) {

            return res.status(400).json({
                success: false,
                message: "Dados da mídia inválidos"
            });

        }


        const { data: existing, error: searchError } =
            await supabase
                .from("media_library")
                .select("*")
                .eq("tmdb_id", tmdbId)
                .eq("type", type)
                .eq("user_id", req.user.id)
                .maybeSingle();


        if (searchError) {

            console.error(
                "Erro ao verificar mídia:",
                searchError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Não foi possível salvar a mídia"
            });

        }


        const mediaData = {

            user_id: req.user.id,

            tmdb_id:
                Number(tmdbId),

            type,

            title,

            poster_path:
                posterPath ??
                existing?.poster_path ??
                null,

            release_date:
                releaseDate ??
                existing?.release_date ??
                null,

            vote_average:
                voteAverage ??
                existing?.vote_average ??
                null,

            status:
                status ??
                existing?.status ??
                "want",

            favorite:
                favorite ??
                existing?.favorite ??
                false,

            season_number:
                type === "series" ||
                type === "anime"
                    ? (
                        seasonNumber ??
                        existing?.season_number ??
                        null
                    )
                    : null,

            episode_number:
                type === "series" ||
                type === "anime"
                    ? (
                        episodeNumber ??
                        existing?.episode_number ??
                        null
                    )
                    : null

        };


        let data;
        let error;


        if (existing) {

            const result =
                await supabase
                    .from("media_library")
                    .update(mediaData)
                    .eq("id", existing.id)
                    .eq("user_id", req.user.id)
                    .select()
                    .single();

            data =
                result.data;

            error =
                result.error;

        } else {

            const result =
                await supabase
                    .from("media_library")
                    .insert(mediaData)
                    .select()
                    .single();

            data =
                result.data;

            error =
                result.error;

        }


        if (error) {

            console.error(
                "Erro ao salvar mídia:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Não foi possível salvar a mídia"
            });

        }


        res.json({
            success: true,
            media: data
        });


    } catch (error) {

        console.error(
            "Erro ao salvar mídia:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno no servidor"
        });

    }

});

// =========================
// ATUALIZAR STATUS DA MÍDIA
// =========================

app.patch(
    "/api/media/:type/:tmdbId/status",
    async (req, res) => {

        try {

            const type =
                req.params.type;

            const tmdbId =
                Number(req.params.tmdbId);

            const { status } =
                req.body;

            if (
                !["movie", "series", "anime"].includes(type) ||
                !tmdbId ||
                !["want", "watching", "completed"].includes(status)
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Dados de status inválidos"
                });

            }

            const { data, error } =
                await supabase
                    .from("media_library")
                    .update({
                        status: status
                    })
                    .eq("tmdb_id", tmdbId)
                    .eq("type", type)
                    .eq("user_id", req.user.id)
                    .select()
                    .single();

            if (error) {

                console.error(
                    "Erro ao atualizar status:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Não foi possível atualizar o status"
                });

            }

            res.json({
                success: true,
                media: data
            });

        } catch (error) {

            console.error(
                "Erro ao atualizar status:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Erro interno ao atualizar status"
            });

        }

    }
);


// =========================
// REMOVER MÍDIA
// =========================

app.delete(
    "/api/media/:type/:tmdbId",
    async (req, res) => {

        try {

            const type =
                req.params.type;

            const tmdbId =
                Number(req.params.tmdbId);


            if (
                !["movie", "series", "anime"]
                    .includes(type) ||
                !tmdbId
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Dados da mídia inválidos"
                });

            }


            const { error } =
                await supabase
                    .from("media_library")
                    .delete()
                    .eq("tmdb_id", tmdbId)
                    .eq("type", type)
                    .eq("user_id", req.user.id);


            if (error) {

                console.error(
                    "Erro ao remover mídia:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Não foi possível remover a mídia"
                });

            }


            res.json({
                success: true
            });


        } catch (error) {

            console.error(
                "Erro ao remover mídia:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Erro interno no servidor"
            });

        }

    }
);




app.delete("/api/media/:type/:tmdbId", async (req, res) => {

    try {

        const type = req.params.type;
        const tmdbId = Number(req.params.tmdbId);

        if (
            !["movie", "series"].includes(type) ||
            !tmdbId
        ) {
            return res.status(400).json({
                success: false,
                message: "Dados da mídia inválidos"
            });
        }

        const { error } =
            await supabase
                .from("media_library")
                .delete()
                .eq("tmdb_id", tmdbId)
                .eq("type", type)
                .eq("user_id", req.user.id);

        if (error) {
            console.error(
                "Erro ao remover mídia:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Não foi possível remover a mídia"
            });
        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "Erro ao remover mídia:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno no servidor"
        });

    }

});

// =========================
// FINANÇAS
// =========================

app.get("/api/finance", async (req, res) => {

    try {

        const { data, error } =
            await supabase
                .from("finance_transactions")
                .select("*")
                .eq("user_id", req.user.id)
                .order("transaction_date", {
                    ascending: false
                })
                .order("created_at", {
                    ascending: false
                });

        if (error) {

            console.error(
                "Erro ao buscar movimentações:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Não foi possível carregar as movimentações"
            });

        }

        res.json({
            success: true,
            transactions: data
        });

    } catch (error) {

        console.error(
            "Erro ao buscar movimentações:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Erro interno no servidor"
        });

    }

});


app.post("/api/finance", async (req, res) => {

    try {

        const {
            type,
            description,
            amount,
            category,
            transactionDate
        } = req.body;

        if (
            !["income", "expense"].includes(type) ||
            !description?.trim() ||
            amount === undefined ||
            Number(amount) <= 0 ||
            !category
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Dados da movimentação inválidos"
            });

        }

        const { data, error } =
            await supabase
                .from("finance_transactions")
                .insert({
                    user_id: req.user.id,
                    type,
                    description: description.trim(),
                    amount: Number(amount),
                    category,
                    transaction_date:
                        transactionDate || undefined
                })
                .select()
                .single();

        if (error) {

            console.error(
                "Erro ao salvar movimentação:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Não foi possível salvar a movimentação"
            });

        }

        res.json({
            success: true,
            transaction: data
        });

    } catch (error) {

        console.error(
            "Erro ao salvar movimentação:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Erro interno no servidor"
        });

    }

});


app.delete("/api/finance/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);

        if (!id) {

            return res.status(400).json({
                success: false,
                message:
                    "ID da movimentação inválido"
            });

        }

        const { error } =
            await supabase
                .from("finance_transactions")
                .delete()
                .eq("id", id)
                .eq("user_id", req.user.id);

        if (error) {

            console.error(
                "Erro ao remover movimentação:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Não foi possível remover a movimentação"
            });

        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "Erro ao remover movimentação:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Erro interno no servidor"
        });

    }

});

app.put("/api/finance/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const {
            type,
            description,
            amount,
            category,
            transactionDate
        } = req.body;


        if (
            !id ||
            !["income", "expense"].includes(type) ||
            !description?.trim() ||
            amount === undefined ||
            Number(amount) <= 0 ||
            !category ||
            !transactionDate
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Dados da movimentação inválidos"
            });

        }


        const { data, error } =
            await supabase
                .from("finance_transactions")
                .update({
                    type,
                    description:
                        description.trim(),
                    amount:
                        Number(amount),
                    category,
                    transaction_date:
                        transactionDate
                })
                .eq("id", id)
                .eq("user_id", req.user.id)
                .select()
                .single();


        if (error) {

            console.error(
                "Erro ao atualizar movimentação:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Não foi possível atualizar a movimentação"
            });

        }


        res.json({
            success: true,
            transaction: data
        });

    } catch (error) {

        console.error(
            "Erro ao atualizar movimentação:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Erro interno no servidor"
        });

    }

});



// =========================
// TAREFAS / AGENDA / PROJETOS — DADOS POR USUÁRIO
// =========================

async function syncUserTable(req, res, table, rows, normalize) {
    try {
        const userId = req.user.id;
        const normalized = Array.isArray(rows) ? rows.map(normalize) : [];

        const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq("user_id", userId);

        if (deleteError) throw deleteError;

        if (normalized.length > 0) {
            const { error: insertError } = await supabase
                .from(table)
                .insert(normalized.map(row => ({ ...row, user_id: userId })));

            if (insertError) throw insertError;
        }

        res.json({ success: true });
    } catch (error) {
        console.error(`Erro ao sincronizar ${table}:`, error);
        res.status(500).json({
            success: false,
            message: "Não foi possível salvar os dados"
        });
    }
}

app.get("/api/tasks", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("tasks")
            .select("id,title,priority,completed,created_at")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: true });
        if (error) throw error;
        res.json({ success: true, tasks: data || [] });
    } catch (error) {
        console.error("Erro ao buscar tarefas:", error);
        res.status(500).json({ success: false, message: "Não foi possível carregar as tarefas" });
    }
});

app.put("/api/tasks/sync", async (req, res) => {
    await syncUserTable(req, res, "tasks", req.body?.tasks, task => ({
        id: Number(task.id),
        title: String(task.title || "").trim(),
        priority: task.priority || "normal",
        completed: Boolean(task.completed)
    }));
});

app.get("/api/events", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("agenda_events")
            .select("id,title,date,start_time,end_time,reminder,repeat,weekdays,notes,created_at")
            .eq("user_id", req.user.id)
            .order("date", { ascending: true });
        if (error) throw error;
        res.json({
            success: true,
            events: (data || []).map(event => ({
                id: Number(event.id),
                title: event.title,
                date: event.date,
                start: event.start_time || "",
                end: event.end_time || "",
                reminder: event.reminder || "none",
                repeat: event.repeat || "none",
                weekdays: event.weekdays || [],
                notes: event.notes || ""
            }))
        });
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        res.status(500).json({ success: false, message: "Não foi possível carregar a agenda" });
    }
});

app.put("/api/events/sync", async (req, res) => {
    await syncUserTable(req, res, "agenda_events", req.body?.events, event => ({
        id: Number(event.id),
        title: String(event.title || "").trim(),
        date: event.date,
        start_time: event.start || "",
        end_time: event.end || "",
        reminder: event.reminder || "none",
        repeat: event.repeat || "none",
        weekdays: Array.isArray(event.weekdays) ? event.weekdays : [],
        notes: event.notes || ""
    }));
});

app.get("/api/projects", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("projects")
            .select("id,name,status,progress,deadline,description,created_at")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: true });
        if (error) throw error;
        res.json({ success: true, projects: data || [] });
    } catch (error) {
        console.error("Erro ao buscar projetos:", error);
        res.status(500).json({ success: false, message: "Não foi possível carregar os projetos" });
    }
});

app.put("/api/projects/sync", async (req, res) => {
    await syncUserTable(req, res, "projects", req.body?.projects, project => ({
        id: Number(project.id),
        name: String(project.name || "").trim(),
        status: project.status || "active",
        progress: Math.max(0, Math.min(100, Number(project.progress) || 0)),
        deadline: project.deadline || null,
        description: project.description || "",
        created_at: project.createdAt || new Date().toISOString()
    }));
});

app.get("/api/project-tasks", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("project_tasks")
            .select("id,project_id,title,completed,created_at")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: true });
        if (error) throw error;
        res.json({
            success: true,
            projectTasks: (data || []).map(task => ({
                id: Number(task.id),
                projectId: Number(task.project_id),
                title: task.title,
                completed: Boolean(task.completed)
            }))
        });
    } catch (error) {
        console.error("Erro ao buscar tarefas dos projetos:", error);
        res.status(500).json({ success: false, message: "Não foi possível carregar as tarefas dos projetos" });
    }
});

app.put("/api/project-tasks/sync", async (req, res) => {
    await syncUserTable(req, res, "project_tasks", req.body?.projectTasks, task => ({
        id: Number(task.id),
        project_id: Number(task.projectId),
        title: String(task.title || "").trim(),
        completed: Boolean(task.completed)
    }));
});

app.get("/api/steam/achievements", async (req, res) => {

    try {

        const steamId = String(req.query.steamId || "").trim();
        const appId = String(req.query.appId || "").trim();

        if (!/^\d{17}$/.test(steamId) || !/^\d+$/.test(appId)) {
            return res.status(400).json({
                success: false,
                message: "Steam ID ou App ID não informado"
            });
        }

        const url =
            `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/` +
            `?key=${process.env.STEAM_API_KEY}` +
            `&steamid=${steamId}` +
            `&appid=${appId}`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.json({
                success: true,
                data: null
            });
        }

        const data = await response.json();

        res.json({
            success: true,
            data: data.playerstats || null
        });

    } catch (error) {

        console.error(
            "Erro ao buscar conquistas:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Não foi possível buscar as conquistas"
        });

    }

});

app.get("/api/tmdb/search", async (req, res) => {

    try {

        const query = req.query.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Nome do filme não informado"
            });
        }

        const url =
            `https://api.themoviedb.org/3/search/movie` +
            `?api_key=${process.env.TMDB_API_KEY}` +
            `&query=${encodeURIComponent(query)}` +
            `&language=pt-BR`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: "Erro ao buscar filmes no TMDB"
            });
        }

        const data = await response.json();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Erro TMDB:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno ao buscar filmes"
        });

    }

});

app.get("/api/tmdb/movie/:id", async (req, res) => {

    try {

        const movieId = req.params.id;

        if (!movieId) {
            return res.status(400).json({
                success: false,
                message: "ID do filme não informado"
            });
        }

        const url =
            `https://api.themoviedb.org/3/movie/${movieId}` +
            `?api_key=${process.env.TMDB_API_KEY}` +
            `&language=pt-BR`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: "Erro ao buscar detalhes do filme"
            });
        }

        const data = await response.json();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Erro ao buscar detalhes do filme:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno ao buscar detalhes"
        });

    }

});

app.get("/api/tmdb/series/search", async (req, res) => {

    try {

        const query = req.query.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Nome da série não informado"
            });
        }

        const url =
            `https://api.themoviedb.org/3/search/tv` +
            `?api_key=${process.env.TMDB_API_KEY}` +
            `&query=${encodeURIComponent(query)}` +
            `&language=pt-BR`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: "Erro ao buscar séries no TMDB"
            });
        }

        const data = await response.json();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Erro ao buscar séries:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno ao buscar séries"
        });

    }

});

app.get("/api/tmdb/series/:id", async (req, res) => {

    try {

        const seriesId = req.params.id;

        if (!seriesId) {
            return res.status(400).json({
                success: false,
                message: "ID da série não informado"
            });
        }

        const url =
            `https://api.themoviedb.org/3/tv/${seriesId}` +
            `?api_key=${process.env.TMDB_API_KEY}` +
            `&language=pt-BR`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: "Erro ao buscar detalhes da série"
            });
        }

        const data = await response.json();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Erro ao buscar detalhes da série:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Erro interno ao buscar detalhes"
        });

    }

});

// =========================
// ERROS / INICIALIZAÇÃO
// =========================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint não encontrado"
    });
});

app.use((error, req, res, next) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            success: false,
            message: "O arquivo é muito grande. O limite é de 25 MB."
        });
    }

    console.error("Erro não tratado no servidor:", error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: "Erro interno no servidor"
    });
});

app.listen(PORT, () => {
    console.log(`ORBIT rodando em http://localhost:${PORT}`);
});
