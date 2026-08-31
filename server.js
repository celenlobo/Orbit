require("dotenv").config();


const express = require("express");
const path = require("path");
const supabase = require("./supabase");
const multer = require("multer");

const app = express();
const PORT = 3000;

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