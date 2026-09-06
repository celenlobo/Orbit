require("dotenv").config();


const express = require("express");
const path = require("path");
const supabase = require("./supabase");
const multer = require("multer");

const app = express();
const PORT = 3000;

app.use(express.json());

const upload =
    multer({
        storage: multer.memoryStorage()
    });



app.use(express.json());
app.use(express.static(path.join(__dirname)));

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


            if (!subjectId) {
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


            const fileName =
                `${Date.now()}-${req.file.originalname}`;


            const filePath =
                `studies/${fileName}`;


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
                            req.file.mimetype

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
);~

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
                    .eq("id", fileId);


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

        const steamId = req.query.steamId;

        if (!steamId) {
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

        if (!steamId) {
            return res.status(400).json({
                success: false,
                message: "Steam ID não informado"
            });
        }

        const { data: existing, error: searchError } =
            await supabase
                .from("user_settings")
                .select("id")
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
                    .select()
                    .single();

            data = result.data;
            error = result.error;

        } else {

            const result =
                await supabase
                    .from("user_settings")
                    .insert({
                        steam_id: steamId
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
// BIBLIOTECA DE FILMES E SÉRIES
// =========================

app.get("/api/media/:type", async (req, res) => {

    try {

        const type = req.params.type;

        if (!["movie", "series"].includes(type)) {
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
                message: "Não foi possível carregar a biblioteca"
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
            favorite
        } = req.body;

        if (
            !tmdbId ||
            !["movie", "series"].includes(type) ||
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
                .select("id")
                .eq("tmdb_id", tmdbId)
                .eq("type", type)
                .maybeSingle();

        if (searchError) {
            console.error(
                "Erro ao verificar mídia:",
                searchError
            );

            return res.status(500).json({
                success: false,
                message: "Não foi possível salvar a mídia"
            });
        }

        let data;
        let error;

        const mediaData = {
            tmdb_id: tmdbId,
            type: type,
            title: title,
            poster_path: posterPath || null,
            release_date: releaseDate || null,
            vote_average: voteAverage ?? null,
            status: status || "want",
            favorite: Boolean(favorite)
        };

        if (existing) {

            const result =
                await supabase
                    .from("media_library")
                    .update(mediaData)
                    .eq("id", existing.id)
                    .select()
                    .single();

            data = result.data;
            error = result.error;

        } else {

            const result =
                await supabase
                    .from("media_library")
                    .insert(mediaData)
                    .select()
                    .single();

            data = result.data;
            error = result.error;

        }

        if (error) {
            console.error(
                "Erro ao salvar mídia:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Não foi possível salvar a mídia"
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
                .eq("type", type);

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
                .eq("id", id);

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

app.listen(PORT, () => {
    console.log(`ORBIT rodando em http://localhost:${PORT}`);
});

app.get("/api/steam/achievements", async (req, res) => {

    try {

        const steamId = req.query.steamId;
        const appId = req.query.appId;

        if (!steamId || !appId) {
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