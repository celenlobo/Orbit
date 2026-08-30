const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;



app.use(express.json());
app.use(express.static(path.join(__dirname)));

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