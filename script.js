/* =====================================================
   ORBIT — SCRIPT PRINCIPAL
===================================================== */


/* =====================================================
   NAVEGAÇÃO
===================================================== */

const navItems = document.querySelectorAll(".nav-item");
const mobileMoreItems = document.querySelectorAll(".mobile-more-item");
const pageLinks = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");

function navigateToPage(pageId, clickedItem = null) {

    if (!pageId) {
        return;
    }

    if (typeof window.orbitRememberPage === "function") {
        window.orbitRememberPage(pageId);
    }

    pages.forEach((page) => {
        page.classList.add("hidden");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }

    navItems.forEach((navItem) => {
        navItem.classList.toggle("active", navItem.dataset.page === pageId);
    });

    mobileMoreItems.forEach((item) => {
        item.classList.toggle("active", item.dataset.page === pageId);
    });

    if (clickedItem?.classList.contains("nav-more")) {
        clickedItem.classList.add("active");
    }

    const mobileMoreMenu = document.getElementById("mobile-more-menu");
    mobileMoreMenu?.classList.remove("open");
}

pageLinks.forEach((item) => {

    item.addEventListener("click", (event) => {

        event.preventDefault();

        navigateToPage(item.dataset.page, item);

    });

});


/* =====================================================
   TAREFAS
===================================================== */

const addTaskButton =
    document.getElementById("add-task-button");

const taskForm =
    document.getElementById("task-form");

const taskTitle =
    document.getElementById("task-title");

const taskPriority =
    document.getElementById("task-priority");

const saveTaskButton =
    document.getElementById("save-task");

const tasksContainer =
    document.getElementById("tasks-container");

const totalTasks =
    document.getElementById("total-tasks");

const pendingTasks =
    document.getElementById("pending-tasks");

const completedTasks =
    document.getElementById("completed-tasks");

const taskFilters =
    document.querySelectorAll(".task-filter");


let tasks = [];


let currentTaskFilter = "all";


async function saveTasks() {
    try {
        const response = await fetch("/api/tasks/sync", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tasks })
        });
        if (!response.ok) throw new Error("Falha ao salvar tarefas");
        return true;
    } catch (error) {
        console.error("Erro ao salvar tarefas:", error);
        return false;
    }
}


addTaskButton.addEventListener(
    "click",
    () => {

        taskForm.classList.toggle("hidden");

        if (!taskForm.classList.contains("hidden")) {
            taskTitle.focus();
        }

    }
);


saveTaskButton.addEventListener(
    "click",
    addTask
);


taskTitle.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            addTask();
        }

    }
);


function addTask() {

    const title =
        taskTitle.value.trim();

    if (title === "") {
        return;
    }

    const newTask = {

        id: Date.now(),

        title: title,

        priority: taskPriority.value,

        completed: false

    };

    tasks.push(newTask);

    saveTasks();

    renderTasks();

    updateDashboardTasks();

    taskTitle.value = "";

    taskPriority.value = "normal";

    taskForm.classList.add("hidden");

}


taskFilters.forEach((filterButton) => {

    filterButton.addEventListener(
        "click",
        () => {

            taskFilters.forEach((button) => {
                button.classList.remove("active");
            });

            filterButton.classList.add("active");

            currentTaskFilter =
                filterButton.dataset.filter;

            renderTasks();

        }
    );

});


function renderTasks() {

    updateTaskStats();

    let filteredTasks = tasks;


    if (currentTaskFilter === "pending") {

        filteredTasks =
            tasks.filter(
                (task) => !task.completed
            );

    }


    if (currentTaskFilter === "completed") {

        filteredTasks =
            tasks.filter(
                (task) => task.completed
            );

    }


    if (filteredTasks.length === 0) {

        tasksContainer.innerHTML = `

            <div class="empty-tasks">

                <span>✓</span>

                <h3>
                    Nenhuma tarefa encontrada
                </h3>

                <p>
                    Não há tarefas nessa categoria.
                </p>

            </div>

        `;

        return;

    }


    tasksContainer.innerHTML = "";


    filteredTasks.forEach((task) => {

        const taskElement =
            document.createElement("div");

        taskElement.classList.add("task");


        if (task.completed) {
            taskElement.classList.add("completed");
        }


        let priorityText = "Normal";


        if (task.priority === "high") {
            priorityText = "Alta";
        }


        if (task.priority === "low") {
            priorityText = "Baixa";
        }


        taskElement.innerHTML = `

            <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? "checked" : ""}
            >

            <div class="task-content">

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>

                <div class="task-priority">
                    Prioridade: ${priorityText}
                </div>

            </div>

            <button
                class="delete-task"
                title="Excluir tarefa"
            >
                ×
            </button>

        `;


        const checkbox =
            taskElement.querySelector(
                ".task-checkbox"
            );


        checkbox.addEventListener(
            "change",
            () => {

                task.completed =
                    checkbox.checked;

                saveTasks();

                renderTasks();

                updateDashboardTasks();

            }
        );


        const deleteButton =
            taskElement.querySelector(
                ".delete-task"
            );


        deleteButton.addEventListener(
            "click",
            () => {

                tasks =
                    tasks.filter(
                        (item) =>
                            item.id !== task.id
                    );

                saveTasks();

                renderTasks();

                updateDashboardTasks();

            }
        );


        tasksContainer.appendChild(
            taskElement
        );

    });

}


function updateTaskStats() {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            (task) => task.completed
        ).length;

    const pending =
        total - completed;


    totalTasks.textContent = total;

    pendingTasks.textContent = pending;

    completedTasks.textContent = completed;

}

// =========================
// FILMES - TMDB
// =========================

const movieSearchInput =
    document.getElementById("movie-search-input");

const movieSearchButton =
    document.getElementById("movie-search-button");

const moviesContainer =
    document.getElementById("movies-container");


movieSearchButton.addEventListener(
    "click",
    searchMovies
);


movieSearchInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            searchMovies();
        }

    }
);


async function searchMovies() {

    const query =
        movieSearchInput.value.trim();

    if (!query) {
        return;
    }

    moviesContainer.innerHTML =
        "<p>Pesquisando filmes...</p>";

    try {

        const response =
            await fetch(
                `/api/tmdb/search?query=${encodeURIComponent(query)}`
            );

        if (!response.ok) {
            throw new Error(
                "Não foi possível buscar os filmes"
            );
        }

        const result =
            await response.json();

        const movies =
            result.data.results;

        renderMovies(movies);

    } catch (error) {

        console.error(
            "Erro ao buscar filmes:",
            error
        );

        moviesContainer.innerHTML =
            "<p>Erro ao buscar filmes.</p>";

    }

}


function renderMovies(movies) {

    if (!movies || movies.length === 0) {

        moviesContainer.innerHTML =
            "<p>Nenhum filme encontrado.</p>";

        return;
    }


    moviesContainer.innerHTML =
        movies.map(
            (movie) => {

                const poster =
                    movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : "https://via.placeholder.com/500x750?text=Sem+imagem";

                const year =
                    movie.release_date
                        ? movie.release_date.slice(0, 4)
                        : "Ano desconhecido";


                return `
                    <div
                        class="movie-card"
                        data-movie-id="${movie.id}"
                    >

                        <img
                            src="${poster}"
                            alt="${movie.title}"
                        >

                        <div class="movie-card-info">

                            <h3>
                                ${movie.title}
                            </h3>

                            <p>
                                ${year}
                            </p>

                            <span>
                                ⭐ ${movie.vote_average.toFixed(1)}
                            </span>

                        </div>

                    </div>
                `;

            }
        ).join("");

}

// =========================
// SÉRIES - TMDB
// =========================

const seriesSearchInput =
    document.getElementById("series-search-input");

const seriesSearchButton =
    document.getElementById("series-search-button");

const seriesContainer =
    document.getElementById("series-container");


seriesSearchButton.addEventListener(
    "click",
    searchSeries
);


seriesSearchInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            searchSeries();
        }

    }
);


async function searchSeries() {

    const query =
        seriesSearchInput.value.trim();

    if (!query) {
        return;
    }

    seriesContainer.innerHTML =
        "<p>Pesquisando séries...</p>";

    try {

        const response =
            await fetch(
                `/api/tmdb/series/search?query=${encodeURIComponent(query)}`
            );

        if (!response.ok) {
            throw new Error(
                "Não foi possível buscar as séries"
            );
        }

        const result =
            await response.json();

        const series =
            result.data.results;

        renderSeries(series);

    } catch (error) {

        console.error(
            "Erro ao buscar séries:",
            error
        );

        seriesContainer.innerHTML =
            "<p>Erro ao buscar séries.</p>";

    }

}


function renderSeries(series) {

    if (!series || series.length === 0) {

        seriesContainer.innerHTML =
            "<p>Nenhuma série encontrada.</p>";

        return;
    }


    seriesContainer.innerHTML =
        series.map(
            (show) => {

                const poster =
                    show.poster_path
                        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                        : "https://via.placeholder.com/500x750?text=Sem+imagem";

                const year =
                    show.first_air_date
                        ? show.first_air_date.slice(0, 4)
                        : "Ano desconhecido";


                return `
                    <div
                        class="series-card"
                        data-series-id="${show.id}"
                    >

                        <img
                            src="${poster}"
                            alt="${show.name}"
                        >

                        <div class="movie-card-info">

                            <h3>
                                ${show.name}
                            </h3>

                            <p>
                                ${year}
                            </p>

                            <span>
                                ⭐ ${show.vote_average.toFixed(1)}
                            </span>

                        </div>

                    </div>
                `;

            }
        ).join("");

}

// =========================
// BIBLIOTECA DE SÉRIES
// =========================

const seriesLibraryContainer =
    document.getElementById("series-library-container");

const seriesLibraryFilters =
    document.querySelectorAll(".series-library-filter");

let currentSeriesLibraryFilter = "all";

let savedSeriesCache = [];


// =========================
// CARREGAR BIBLIOTECA
// =========================

async function loadSeriesLibrary() {
    try {
        const response =
            await fetch("/api/media/series");

        if (!response.ok) {
            throw new Error(
                "Não foi possível carregar a biblioteca"
            );
        }

        const result =
            await response.json();

        savedSeriesCache =
            (result.media || []).map((series) => ({
                id: Number(series.tmdb_id),
                name: series.title,
                poster_path: series.poster_path,
                first_air_date: series.release_date,
                vote_average:
                    Number(series.vote_average) || 0,
                status: series.status,
                favorite:
                    Boolean(series.favorite),

                season_number:
                    series.season_number !== null &&
                    series.season_number !== undefined
                        ? Number(series.season_number)
                        : null,

                episode_number:
                    series.episode_number !== null &&
                    series.episode_number !== undefined
                        ? Number(series.episode_number)
                        : null
            }));

        renderSeriesLibrary();

        updateDashboardEntertainment();

    } catch (error) {
        console.error(
            "Erro ao carregar biblioteca de séries:",
            error
        );

        if (seriesLibraryContainer) {
            seriesLibraryContainer.innerHTML = `
                <div class="empty-movie-library">
                    <h3>
                        Não foi possível carregar
                    </h3>

                    <p>
                        Tente novamente mais tarde.
                    </p>
                </div>
            `;
        }
    }
}


// =========================
// RENDERIZAR BIBLIOTECA
// =========================

function renderSeriesLibrary() {

    if (!seriesLibraryContainer) {
        return;
    }

    let filteredSeries =
        [...savedSeriesCache];

    if (currentSeriesLibraryFilter === "favorite") {

        filteredSeries =
            filteredSeries.filter(
                (series) =>
                    Boolean(series.favorite)
            );

    } else if (
        currentSeriesLibraryFilter !== "all"
    ) {

        filteredSeries =
            filteredSeries.filter(
                (series) =>
                    series.status ===
                    currentSeriesLibraryFilter
            );
    }


    if (filteredSeries.length === 0) {

        seriesLibraryContainer.innerHTML = `
            <div class="empty-movie-library">
                <h3>
                    Nenhuma série encontrada
                </h3>

                <p>
                    Sua biblioteca de séries está vazia.
                </p>
            </div>
        `;

        return;
    }


    seriesLibraryContainer.innerHTML =
        filteredSeries
            .map((series) => {

                const poster =
                    series.poster_path
                        ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                        : "https://via.placeholder.com/500x750?text=Sem+imagem";

                const year =
                    series.first_air_date
                        ? series.first_air_date.slice(0, 4)
                        : "Ano desconhecido";

                const progress =
                    series.season_number &&
                    series.episode_number
                        ? `
                            <div class="anime-progress">
                                T${series.season_number}
                                • E${series.episode_number}
                            </div>
                        `
                        : "";

                return `
                    <div
                        class="series-card"
                        data-series-id="${series.id}"
                    >

                        <img
                            src="${poster}"
                            alt="${series.name}"
                        >

                        <div class="movie-card-info">

                            <h3>
                                ${series.name}
                            </h3>

                            <p>
                                ${year}
                            </p>

                            <span>
                                ⭐ ${Number(
                                    series.vote_average || 0
                                ).toFixed(1)}
                            </span>

                            <span>
                                ⭐ ${Number(
                                    series.vote_average || 0
                                ).toFixed(1)}
                            </span>

                            ${progress}

                        </div>

                    </div>

                </div>
             `;
         })
    .join("");
}


// =========================
// FILTROS DA BIBLIOTECA
// =========================

seriesLibraryFilters.forEach(
    (filter) => {

        filter.addEventListener(
            "click",
            () => {

                currentSeriesLibraryFilter =
                    filter.dataset.seriesLibraryFilter ||
                    "all";

                seriesLibraryFilters.forEach(
                    (item) => {
                        item.classList.toggle(
                            "active",
                            item === filter
                        );
                    }
                );

                renderSeriesLibrary();
            }
        );
    }
);

// =========================
// ABRIR SÉRIE DA BIBLIOTECA
// =========================

seriesLibraryContainer.addEventListener(
    "click",
    (event) => {

        const card =
            event.target.closest(
                "[data-series-id]"
            );

        if (!card) {
            return;
        }

        const seriesId =
            card.dataset.seriesId;

        openSeriesDetails(seriesId);
    }
);

// =========================
// DETALHES DA SÉRIE
// =========================

const seriesModal =
    document.getElementById("series-modal");

const seriesModalBody =
    document.getElementById("series-modal-body");

const seriesModalClose =
    document.getElementById("series-modal-close");


seriesContainer.addEventListener(
    "click",
    (event) => {

        const card =
            event.target.closest("[data-series-id]");

        if (!card) {
            return;
        }

        const seriesId =
            card.dataset.seriesId;

        openSeriesDetails(seriesId);

    }
);


seriesModalClose.addEventListener(
    "click",
    closeSeriesModal
);


seriesModal.addEventListener(
    "click",
    (event) => {

        if (event.target === seriesModal) {
            closeSeriesModal();
        }

    }
);


// ============================================================
// SÉRIES — MODAL + PROGRESSO
// ============================================================

async function openSeriesDetails(seriesId) {

    seriesModalBody.innerHTML =
        "<p>Carregando detalhes...</p>";

    seriesModal.classList.remove("hidden");

    try {

        const response =
            await fetch(
                `/api/tmdb/series/${seriesId}`
            );

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar detalhes da série"
            );
        }

        const result =
            await response.json();

        renderSeriesDetails(result.data);

        await addSeriesEpisodeProgress(
            result.data,
            result.data
        );

    } catch (error) {

        console.error(
            "Erro ao carregar detalhes da série:",
            error
        );

        seriesModalBody.innerHTML =
            "<p>Não foi possível carregar os detalhes.</p>";
    }
}


function renderSeriesDetails(series) {

    const poster =
        series.poster_path
            ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
            : "";

    const year =
        series.first_air_date
            ? series.first_air_date.slice(0, 4)
            : "Ano desconhecido";

    const rating =
        Number(series.vote_average) || 0;

    const savedSeries =
        getSavedSeries(series.id);

    const status =
        savedSeries?.status || "want";

    const favorite =
        Boolean(savedSeries?.favorite);


    seriesModalBody.innerHTML = `

        <div class="anime-details">

            <div class="anime-details-poster">

                ${
                    poster
                        ? `
                            <img
                                src="${poster}"
                                alt="${series.name}"
                            >
                        `
                        : ""
                }

            </div>


            <div class="anime-details-info">

                <h2>
                    ${series.name}
                </h2>


                <div class="anime-details-meta">

                    <span>
                        ${year}
                    </span>

                    <span>
                        ⭐ ${rating.toFixed(1)}
                    </span>

                    ${
                        series.number_of_seasons
                            ? `
                                <span>
                                    ${series.number_of_seasons}
                                    ${
                                        series.number_of_seasons === 1
                                            ? " temporada"
                                            : " temporadas"
                                    }
                                </span>
                            `
                            : ""
                    }

                    ${
                        series.number_of_episodes
                            ? `
                                <span>
                                    ${series.number_of_episodes}
                                    ${
                                        series.number_of_episodes === 1
                                            ? " episódio"
                                            : " episódios"
                                    }
                                </span>
                            `
                            : ""
                    }

                </div>


                <div class="anime-details-overview">

                    <p>
                        ${
                            series.overview ||
                            "Sinopse não disponível."
                        }
                    </p>

                </div>


                <div class="anime-actions series-actions">

                    <button
                        class="anime-favorite-button series-favorite-button"
                        id="series-favorite-button"
                    >
                        ${
                            favorite
                                ? "❤️ Favoritado"
                                : "♡ Favoritar"
                        }
                    </button>


                    <select id="series-status">

                        <option value="want">
                            Quero assistir
                        </option>

                        <option value="watching">
                            Assistindo
                        </option>

                        <option value="completed">
                            Concluído
                        </option>

                    </select>


                    <button
                        class="anime-remove-button series-remove-button"
                        id="series-remove-button"
                    >
                        🗑️ Remover
                    </button>

                </div>

            </div>

        </div>
    `;


    const favoriteButton =
        document.getElementById(
            "series-favorite-button"
        );

    const statusSelect =
        document.getElementById(
            "series-status"
        );

    const removeButton =
        document.getElementById(
            "series-remove-button"
        );


    statusSelect.value =
        status;


    // ========================================================
    // FAVORITO
    // ========================================================

    favoriteButton.addEventListener(
        "click",
        async () => {

            const current =
                getSavedSeries(series.id);

            const newFavorite =
                current
                    ? !Boolean(current.favorite)
                    : true;

            const currentStatus =
                current?.status ||
                statusSelect.value ||
                "want";

            try {

                await saveSeries(
                    series,
                    currentStatus,
                    newFavorite,
                    current?.season_number ?? null,
                    current?.episode_number ?? null
                );

                favoriteButton.textContent =
                    newFavorite
                        ? "❤️ Favoritado"
                        : "♡ Favoritar";

            } catch (error) {

                console.error(
                    "Erro ao atualizar favorito:",
                    error
                );

            }

        }
    );


    // ========================================================
    // STATUS
    // ========================================================

    statusSelect.addEventListener(
        "change",
        async () => {

            const current =
                getSavedSeries(series.id);

            try {

                await saveSeries(
                    series,
                    statusSelect.value,
                    Boolean(current?.favorite),
                    current?.season_number ?? null,
                    current?.episode_number ?? null
                );

            } catch (error) {

                console.error(
                    "Erro ao atualizar status:",
                    error
                );

            }

        }
    );


    // ========================================================
    // REMOVER
    // ========================================================

    removeButton.addEventListener(
        "click",
        async () => {

            try {

                await removeSeries(
                    series.id
                );

                closeSeriesModal();

            } catch (error) {

                console.error(
                    "Erro ao remover série:",
                    error
                );

            }

        }
    );
}


// ============================================================
// SALVAR SÉRIE
// ============================================================

async function saveSeries(
    series,
    status = "want",
    favorite = false,
    seasonNumber = null,
    episodeNumber = null
) {
    const seriesId = Number(series.id);

    const existingSeries = getSavedSeries(seriesId);

    if (seasonNumber === null && existingSeries) {
        seasonNumber = existingSeries.season_number ?? null;
    }

    if (episodeNumber === null && existingSeries) {
        episodeNumber = existingSeries.episode_number ?? null;
    }

    const previousCache = [...savedSeriesCache];

    // Atualiza o cache imediatamente
    if (existingSeries) {

        existingSeries.status = status;
        existingSeries.favorite = Boolean(favorite);
        existingSeries.season_number = seasonNumber;
        existingSeries.episode_number = episodeNumber;

    } else {

        savedSeriesCache.push({
            id: seriesId,
            name: series.name,
            poster_path: series.poster_path || null,
            first_air_date: series.first_air_date || null,
            vote_average: Number(series.vote_average) || 0,
            status: status,
            favorite: Boolean(favorite),
            season_number: seasonNumber,
            episode_number: episodeNumber
        });

    }

    renderSeriesLibrary();

    try {

        const response = await fetch("/api/media", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                tmdbId: seriesId,
                type: "series",
                title: series.name,
                posterPath: series.poster_path || null,
                releaseDate: series.first_air_date || null,
                voteAverage: Number(series.vote_average) || 0,
                status: status,
                favorite: Boolean(favorite),
                seasonNumber: seasonNumber,
                episodeNumber: episodeNumber
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Não foi possível salvar a série"
            );
        }

        // Garante que o cache fique com apenas
        // uma entrada para essa série
        savedSeriesCache = savedSeriesCache.filter(
            (item, index, array) =>
                item.id !== seriesId ||
                index === array.findIndex(
                    (entry) => entry.id === seriesId
                )
        );

        const savedMedia = result.media;

        const updatedSeries = {
            id: Number(savedMedia.tmdb_id),
            name: savedMedia.title,
            poster_path: savedMedia.poster_path,
            first_air_date: savedMedia.release_date,
            vote_average:
                Number(savedMedia.vote_average) || 0,
            status: savedMedia.status,
            favorite: Boolean(savedMedia.favorite),

            season_number:
                savedMedia.season_number !== null &&
                savedMedia.season_number !== undefined
                    ? Number(savedMedia.season_number)
                    : null,

            episode_number:
                savedMedia.episode_number !== null &&
                savedMedia.episode_number !== undefined
                    ? Number(savedMedia.episode_number)
                    : null
        };

        const index = savedSeriesCache.findIndex(
            (item) => item.id === seriesId
        );

        if (index !== -1) {
            savedSeriesCache[index] = updatedSeries;
        } else {
            savedSeriesCache.push(updatedSeries);
        }

        renderSeriesLibrary();

    } catch (error) {

        console.error(
            "Erro ao salvar série:",
            error
        );

        savedSeriesCache = previousCache;

        renderSeriesLibrary();

        alert(
            "Não foi possível salvar a série."
        );

        throw error;
    }
}


// =========================
// BUSCAR SÉRIE SALVA
// =========================

function getSavedSeries(seriesId) {

    return savedSeriesCache.find(
        (series) =>
            series.id === Number(seriesId)
    );

}


// =========================
// REMOVER SÉRIE
// =========================

async function removeSeries(seriesId) {

    const numericSeriesId =
        Number(seriesId);

    const previousCache =
        [...savedSeriesCache];


    savedSeriesCache =
        savedSeriesCache.filter(
            (series) =>
                series.id !== numericSeriesId
        );


    renderSeriesLibrary();


    try {

        const response =
            await fetch(
                `/api/media/series/${numericSeriesId}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível remover a série"
            );

        }

    } catch (error) {

        console.error(
            "Erro ao remover série:",
            error
        );


        savedSeriesCache =
            previousCache;

        renderSeriesLibrary();

        alert(
            "Não foi possível remover a série."
        );

    }

}


// =========================
// INICIALIZAR BIBLIOTECA
// =========================

loadSeriesLibrary();


// =========================
// FECHAR MODAL
// =========================

function closeSeriesModal() {

    seriesModal.classList.add("hidden");

}

// =========================
// DETALHES DO FILME
// =========================

const movieModal =
    document.getElementById("movie-modal");

const movieModalBody =
    document.getElementById("movie-modal-body");

const movieModalClose =
    document.getElementById("movie-modal-close");


moviesContainer.addEventListener(
    "click",
    (event) => {

        const card =
            event.target.closest(".movie-card");

        if (!card) {
            return;
        }

        const movieId =
            card.dataset.movieId;

        openMovieDetails(movieId);

    }
);


movieModalClose.addEventListener(
    "click",
    closeMovieModal
);


movieModal.addEventListener(
    "click",
    (event) => {

        if (event.target === movieModal) {
            closeMovieModal();
        }

    }
);


async function openMovieDetails(movieId) {

    movieModalBody.innerHTML =
        "<p>Carregando detalhes...</p>";

    movieModal.classList.remove("hidden");

    try {

        const response =
            await fetch(
                `/api/tmdb/movie/${movieId}`
            );

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar detalhes"
            );
        }

        const result =
            await response.json();

        renderMovieDetails(result.data);

    } catch (error) {

        console.error(
            "Erro ao carregar detalhes do filme:",
            error
        );

        movieModalBody.innerHTML =
            "<p>Não foi possível carregar os detalhes.</p>";

    }

}


function renderMovieDetails(movie) {

    const poster =
        movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "";

    const year =
        movie.release_date
            ? movie.release_date.slice(0, 4)
            : "Ano desconhecido";

    movieModalBody.innerHTML = `
        <div class="movie-details">

            <img
                src="${poster}"
                alt="${movie.title}"
            >

            <div class="movie-details-info">

                <h2>
                    ${movie.title}
                </h2>

                <p>
                    ${year}
                </p>

                <p>
                    ⭐ ${movie.vote_average.toFixed(1)}
                </p>

                <p>
                    ${movie.overview || "Sinopse não disponível."}
                </p>

                <div class="movie-actions">

                    <button
                        class="movie-favorite-button"
                        id="movie-favorite-button"
                    >
                        ♡ Favoritar
                    </button>

                    <select id="movie-status">

                        <option value="want">
                            Quero assistir
                        </option>

                        <option value="watching">
                            Assistindo
                        </option>

                        <option value="completed">
                            Concluído
                        </option>

                    </select>

                    <button
                        class="movie-remove-button"
                        id="movie-remove-button"
                    >
                        🗑️ Remover
                    </button>

                </div>

            </div>

        </div>
    `;

    const favoriteButton =
        document.getElementById("movie-favorite-button");

    const statusSelect =
        document.getElementById("movie-status");

    const removeButton =
        document.getElementById("movie-remove-button");

    const savedMovie =
        getSavedMovie(movie.id);


    if (savedMovie) {

        statusSelect.value =
            savedMovie.status;

        favoriteButton.textContent =
            savedMovie.favorite
                ? "❤️ Favoritado"
                : "♡ Favoritar";

    }


    favoriteButton.addEventListener(
        "click",
        () => {

            const currentMovie =
                getSavedMovie(movie.id);

            const favorite =
                currentMovie
                    ? !currentMovie.favorite
                    : true;

            const status =
                currentMovie
                    ? currentMovie.status
                    : statusSelect.value;

            saveMovie(
                movie,
                status,
                favorite
            );

            favoriteButton.textContent =
                favorite
                    ? "❤️ Favoritado"
                    : "♡ Favoritar";

            renderMovieLibrary();

        }
    );


    statusSelect.addEventListener(
        "change",
        () => {

            const currentMovie =
                getSavedMovie(movie.id);

            const favorite =
                currentMovie
                    ? currentMovie.favorite
                    : false;

            saveMovie(
                movie,
                statusSelect.value,
                favorite
            );

            renderMovieLibrary();

        }
    );

    removeButton.addEventListener(
    "click",
    () => {

        removeMovie(movie.id);

        closeMovieModal();

    }
);

}

// =========================
// BIBLIOTECA DE FILMES
// =========================

const movieLibraryContainer =
    document.getElementById("movie-library-container");

const movieLibraryFilters =
    document.querySelectorAll(".movie-library-filter");

let currentMovieLibraryFilter = "all";

let savedMoviesCache = [];


// =========================
// CARREGAR BIBLIOTECA
// =========================

async function loadMovieLibrary() {

    try {

        const response =
            await fetch("/api/media/movie");

        if (!response.ok) {
            throw new Error(
                "Não foi possível carregar a biblioteca"
            );
        }

        const result =
            await response.json();

        savedMoviesCache =
            (result.media || []).map((movie) => ({
                id: Number(movie.tmdb_id),
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                vote_average: Number(movie.vote_average) || 0,
                status: movie.status,
                favorite: movie.favorite
            }));

        renderMovieLibrary();

        updateDashboardEntertainment();

    } catch (error) {

        console.error(
            "Erro ao carregar biblioteca de filmes:",
            error
        );

        movieLibraryContainer.innerHTML = `
            <div class="empty-movie-library">

                <h3>
                    Não foi possível carregar
                </h3>

                <p>
                    Tente novamente mais tarde.
                </p>

            </div>
        `;

    }

}


// =========================
// RENDERIZAR BIBLIOTECA
// =========================

function renderMovieLibrary() {

    let filteredMovies =
        savedMoviesCache;

    if (currentMovieLibraryFilter === "favorite") {

        filteredMovies =
            savedMoviesCache.filter(
                (movie) => movie.favorite
            );

    } else if (
        currentMovieLibraryFilter !== "all"
    ) {

        filteredMovies =
            savedMoviesCache.filter(
                (movie) =>
                    movie.status ===
                    currentMovieLibraryFilter
            );

    }


    if (filteredMovies.length === 0) {

        movieLibraryContainer.innerHTML = `
            <div class="empty-movie-library">

                <h3>
                    Nenhum filme aqui
                </h3>

                <p>
                    Seus filmes salvos aparecerão aqui.
                </p>

            </div>
        `;

        return;
    }


    movieLibraryContainer.innerHTML =
        filteredMovies.map(
            (movie) => {

                const poster =
                    movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : "";

                const year =
                    movie.release_date
                        ? movie.release_date.slice(0, 4)
                        : "Ano desconhecido";

                return `
                    <div
                        class="movie-card"
                        data-movie-id="${movie.id}"
                    >

                        <img
                            src="${poster}"
                            alt="${movie.title}"
                        >

                        <div class="movie-card-info">

                            <h3>
                                ${movie.title}
                            </h3>

                            <p>
                                ${year}
                            </p>

                            <span>
                                ⭐ ${movie.vote_average.toFixed(1)}
                            </span>

                        </div>

                    </div>
                `;

            }
        ).join("");


    movieLibraryContainer
        .querySelectorAll(".movie-card")
        .forEach((card) => {

            card.addEventListener(
                "click",
                () => {

                    const movieId =
                        card.dataset.movieId;

                    openMovieDetails(movieId);

                }
            );

        });

}


// =========================
// FILTROS
// =========================

movieLibraryFilters.forEach(
    (filterButton) => {

        filterButton.addEventListener(
            "click",
            () => {

                movieLibraryFilters.forEach(
                    (button) => {
                        button.classList.remove("active");
                    }
                );

                filterButton.classList.add("active");

                currentMovieLibraryFilter =
                    filterButton.dataset.libraryFilter;

                renderMovieLibrary();

            }
        );

    }
);


// =========================
// BUSCAR FILME SALVO
// =========================

function getSavedMovie(movieId) {

    return savedMoviesCache.find(
        (movie) =>
            movie.id === Number(movieId)
    );

}


// =========================
// SALVAR FILME
// =========================

async function saveMovie(
    movie,
    status = "want",
    favorite = false
) {

    const movieId =
        Number(movie.id);

    const movieData = {
        id: movieId,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: Number(movie.vote_average) || 0,
        status: status,
        favorite: favorite
    };


    const existingMovie =
        getSavedMovie(movieId);


    // Atualiza a interface imediatamente
    if (existingMovie) {

        existingMovie.status =
            status;

        existingMovie.favorite =
            favorite;

    } else {

        savedMoviesCache.push(
            movieData
        );

    }

    renderMovieLibrary();


    try {

        const response =
            await fetch("/api/media", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    tmdbId: movieId,
                    type: "movie",
                    title: movie.title,
                    posterPath:
                        movie.poster_path,
                    releaseDate:
                        movie.release_date,
                    voteAverage:
                        Number(movie.vote_average) || 0,
                    status: status,
                    favorite: favorite
                })

            });


        if (!response.ok) {

            throw new Error(
                "Não foi possível salvar o filme"
            );

        }


        const result =
            await response.json();


        // Atualiza o cache com o registro real do Supabase
        const savedIndex =
            savedMoviesCache.findIndex(
                (item) =>
                    item.id === movieId
            );


        if (savedIndex !== -1) {

            savedMoviesCache[savedIndex] = {
                id: Number(result.media.tmdb_id),
                title: result.media.title,
                poster_path:
                    result.media.poster_path,
                release_date:
                    result.media.release_date,
                vote_average:
                    Number(result.media.vote_average) || 0,
                status:
                    result.media.status,
                favorite:
                    result.media.favorite
            };

        }

        renderMovieLibrary();

    } catch (error) {

        console.error(
            "Erro ao salvar filme:",
            error
        );

        // Desfaz a alteração otimista
        savedMoviesCache =
            savedMoviesCache.filter(
                (item) =>
                    item.id !== movieId
            );

        if (existingMovie) {

            savedMoviesCache.push(
                existingMovie
            );

        }

        renderMovieLibrary();

        alert(
            "Não foi possível salvar o filme."
        );

    }

}


// =========================
// REMOVER FILME
// =========================

async function removeMovie(movieId) {

    const numericMovieId =
        Number(movieId);

    const previousCache =
        [...savedMoviesCache];


    savedMoviesCache =
        savedMoviesCache.filter(
            (movie) =>
                movie.id !== numericMovieId
        );

    renderMovieLibrary();


    try {

        const response =
            await fetch(
                `/api/media/movie/${numericMovieId}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível remover o filme"
            );

        }

    } catch (error) {

        console.error(
            "Erro ao remover filme:",
            error
        );

        savedMoviesCache =
            previousCache;

        renderMovieLibrary();

        alert(
            "Não foi possível remover o filme."
        );

    }

}


// =========================
// INICIALIZAR BIBLIOTECA
// =========================

loadMovieLibrary();
function closeMovieModal() {

    movieModal.classList.add("hidden");

}




/* =====================================================
   AGENDA
===================================================== */

const addEventButton =
    document.getElementById("add-event-button");

const eventForm =
    document.getElementById("event-form");

const closeEventForm =
    document.getElementById("close-event-form");

const cancelEvent =
    document.getElementById("cancel-event");

const saveEventButton =
    document.getElementById("save-event");

const eventTitle =
    document.getElementById("event-title");

const eventDate =
    document.getElementById("event-date");

const eventStart =
    document.getElementById("event-start");

const eventEnd =
    document.getElementById("event-end");

const eventReminder =
    document.getElementById("event-reminder");

const eventRepeat =
    document.getElementById("event-repeat");

const eventWeekdays =
    document.getElementById("event-weekdays");

const eventWeekdayInputs =
    document.querySelectorAll(".event-weekday");

    if (eventRepeat) {

    eventRepeat.addEventListener("change", () => {

        if (eventRepeat.value === "weekdays") {
            eventWeekdays.classList.remove("hidden");
        } else {
            eventWeekdays.classList.add("hidden");
        }

    });

}

const eventNotes =
    document.getElementById("event-notes");

const agenda =
    document.getElementById("agenda");

const calendarDate =
    document.getElementById("calendar-date");

const calendarWeekday =
    document.getElementById("calendar-weekday");

const calendarDatePicker =
    document.getElementById("calendar-date-picker");

const calendarDateInput =
    document.getElementById("calendar-date-input");

const previousDay =
    document.getElementById("previous-day");

const nextDay =
    document.getElementById("next-day");


let events = [];


let selectedDate = new Date();


async function saveEvents() {
    try {
        const response = await fetch("/api/events/sync", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ events })
        });
        if (!response.ok) throw new Error("Falha ao salvar agenda");
        window.dispatchEvent(new CustomEvent("orbit:events-updated"));
    } catch (error) {
        console.error("Erro ao salvar agenda:", error);
    }
}


function formatDateForInput(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function formatDate(date) {

    return date.toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


function formatWeekday(date) {

    return date.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long"
        }
    );

}


function updateCalendarHeader() {

    if (!calendarDate || !calendarWeekday) {
        return;
    }

    calendarDate.textContent =
        formatDate(selectedDate);

    calendarWeekday.textContent =
        formatWeekday(selectedDate);

    renderAgenda();

}


function changeDay(amount) {

    selectedDate.setDate(
        selectedDate.getDate() + amount
    );

    updateCalendarHeader();

}


if (previousDay) {

    previousDay.addEventListener(
        "click",
        () => changeDay(-1)
    );

}


if (nextDay) {

    nextDay.addEventListener(
        "click",
        () => changeDay(1)
    );

}

if (calendarDatePicker && calendarDateInput) {

    calendarDatePicker.addEventListener(
        "click",
        () => {

            calendarDateInput.showPicker();

        }
    );

    calendarDateInput.addEventListener(
        "change",
        () => {

            if (!calendarDateInput.value) {
                return;
            }

            selectedDate =
                new Date(
                    `${calendarDateInput.value}T12:00:00`
                );

            updateCalendarHeader();

        }
    );

}


if (addEventButton) {

    addEventButton.addEventListener(
        "click",
        () => {

            eventForm.classList.remove("hidden");

            eventDate.value =
                formatDateForInput(
                    selectedDate
                );

            eventTitle.focus();

        }
    );

}


function closeEventFormFunction() {

    if (!eventForm) {
        return;
    }

    eventForm.classList.add("hidden");

    eventTitle.value = "";

    eventStart.value = "";

    eventEnd.value = "";

    eventReminder.value = "none";

    eventRepeat.value = "none";

    eventWeekdayInputs.forEach(
        input => {
            input.checked = false;
        }
    );

    eventWeekdays.classList.add("hidden");

    eventNotes.value = "";

}


if (closeEventForm) {

    closeEventForm.addEventListener(
        "click",
        closeEventFormFunction
    );

}


if (cancelEvent) {

    cancelEvent.addEventListener(
        "click",
        closeEventFormFunction
    );

}


if (saveEventButton) {

    saveEventButton.addEventListener(
        "click",
        saveEvent
    );

}


function saveEvent() {

    const title =
        eventTitle.value.trim();

    const date =
        eventDate.value;

    const start =
        eventStart.value;

    const end =
        eventEnd.value;

    const reminder =
        eventReminder.value;

    const notes =
        eventNotes.value.trim();

    const repeat =
    eventRepeat.value;

    const weekdays =
        Array.from(eventWeekdayInputs)
            .filter(input => input.checked)
            .map(input => Number(input.value));


    if (
        title === "" ||
        date === ""
    ) {

        alert(
            "Digite pelo menos o título e a data."
        );

        return;

    }


    const newEvent = {
        id: Date.now(),
        title,
        date,
        start,
        end,
        reminder,
        repeat,
        weekdays,
        notes
};


    events.push(newEvent);

    saveEvents();


    selectedDate =
        new Date(
            `${date}T12:00:00`
        );


    updateCalendarHeader();

    closeEventFormFunction();

    scheduleReminder(newEvent);

}

function eventOccursOnDate(event, date) {

    const originalDate =
        new Date(
            `${event.date}T12:00:00`
        );

    const targetDate =
        new Date(
            `${formatDateForInput(date)}T12:00:00`
        );

    if (targetDate < originalDate) {
        return false;
    }

    if (!event.repeat || event.repeat === "none") {
        return (
            formatDateForInput(targetDate) ===
            event.date
        );
    }

    if (event.repeat === "daily") {
        return true;
    }

    if (event.repeat === "weekly") {
        return (
            targetDate.getDay() ===
            originalDate.getDay()
        );
    }

    if (event.repeat === "weekdays") {
        return (
            event.weekdays || []
        ).includes(
            targetDate.getDay()
        );
    }

    if (event.repeat === "monthly") {
        return (
            targetDate.getDate() ===
            originalDate.getDate()
        );
    }

    return false;
}

function renderAgenda() {

    if (!agenda) {
        return;
    }


    const dateString =
        formatDateForInput(
            selectedDate
        );


    const dayEvents =
    events
        .filter(
            (event) =>
                eventOccursOnDate(
                    event,
                    selectedDate
                )
        )


    if (dayEvents.length === 0) {

        agenda.innerHTML = `

            <div class="no-events">

                Nenhum compromisso para este dia.

            </div>

        `;

        return;

    }


    agenda.innerHTML = "";


    dayEvents.forEach((event) => {

        const eventElement =
            document.createElement("div");


        eventElement.classList.add(
            "agenda-time"
        );


        const timeLabel =
            event.start || "--:--";


        const endLabel =
            event.end
                ? ` - ${event.end}`
                : "";


        eventElement.innerHTML = `

            <div class="agenda-time-label">
                ${timeLabel}
            </div>

            <div class="agenda-slot">

                <div class="calendar-event">

                    <div class="calendar-event-title">
                        ${escapeHTML(event.title)}
                    </div>

                    <div class="calendar-event-time">
                        ${timeLabel}${endLabel}
                    </div>

                    ${
                        event.notes
                            ? `
                                <div class="calendar-event-notes">
                                    ${escapeHTML(event.notes)}
                                </div>
                            `
                            : ""
                    }

                    <button
                        class="delete-event"
                        title="Excluir evento"
                    >
                        ×
                    </button>

                </div>

            </div>

        `;


        const deleteButton =
            eventElement.querySelector(
                ".delete-event"
            );


        deleteButton.addEventListener(
            "click",
            () => {

                deleteEvent(event.id);

            }
        );


        agenda.appendChild(
            eventElement
        );

    });

}


function deleteEvent(id) {

    events =
        events.filter(
            (event) =>
                event.id !== id
        );

    saveEvents();

    renderAgenda();

}


function getNotificationStorageKey() {
    return window.orbitUserId ? `orbitNotificationSettings:${window.orbitUserId}` : null;
}

function getNotificationSettings() {
    const key = getNotificationStorageKey();
    if (!key) return { enabled: false };

    try {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return { enabled: saved.enabled === true };
    } catch {
        return { enabled: false };
    }
}

function setNotificationSettings(settings) {
    const key = getNotificationStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify({ enabled: settings.enabled === true }));
}

function browserNotificationsSupported() {
    return "Notification" in window;
}

function scheduleReminder(event) {
    if (event.reminder === "none" || !event.start || !event.date || !getNotificationSettings().enabled) {
        return;
    }

    const eventDateTime = new Date(`${event.date}T${event.start}:00`);
    const reminderMinutes = Number(event.reminder);
    const reminderTime = eventDateTime.getTime() - reminderMinutes * 60 * 1000;
    const delay = reminderTime - Date.now();

    if (!Number.isFinite(delay) || delay <= 0) return;

    setTimeout(() => {
        if (getNotificationSettings().enabled) {
            showReminder(event);
        }
    }, delay);
}

function showReminder(event) {
    if (browserNotificationsSupported() && Notification.permission === "granted") {
        const notification = new Notification("ORBIT — Lembrete 🔔", { body: event.title });
        notification.onclick = () => {
            window.focus();
            navigateToPage("agenda");
            notification.close();
        };
        return;
    }

    alert(`🔔 Lembrete ORBIT\n\n${event.title}`);
}

async function requestNotificationPermission() {
    if (!browserNotificationsSupported()) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";

    return Notification.requestPermission();
}

/* =====================================================
   DASHBOARD — DADOS REAIS
===================================================== */

const dashboardFinanceBalance =
    document.getElementById(
        "dashboard-finance-balance"
    );

const dashboardStudyCount =
    document.getElementById(
        "dashboard-study-count"
    );

const dashboardEntertainmentCount =
    document.getElementById(
        "dashboard-entertainment-count"
    );

const dashboardFocusTitle =
    document.getElementById(
        "dashboard-focus-title"
    );

const dashboardFocusDescription =
    document.getElementById(
        "dashboard-focus-description"
    );

const dashboardFocusButton =
    document.getElementById(
        "dashboard-focus-button"
    );


function updateDashboardTasks() {

    if (
        !dashboardFocusTitle ||
        !dashboardFocusDescription
    ) {
        return;
    }


    const pendingTask =
        tasks.find(
            (task) =>
                !task.completed
        );


    if (!pendingTask) {

        dashboardFocusTitle.textContent =
            "Nenhuma tarefa pendente";

        dashboardFocusDescription.textContent =
            "Você está em dia.";

        if (dashboardFocusButton) {
            dashboardFocusButton.textContent =
                "Ver tarefas →";
        }

        return;

    }


    dashboardFocusTitle.textContent =
        pendingTask.title;


    const priorityText = {

        high: "Prioridade alta",

        normal: "Prioridade normal",

        low: "Prioridade baixa"

    };


    dashboardFocusDescription.textContent =
        priorityText[
            pendingTask.priority
        ] || "Tarefa pendente";


    if (dashboardFocusButton) {

        dashboardFocusButton.textContent =
            "Ver tarefas →";

    }

}


function updateDashboardStudies() {

    if (!dashboardStudyCount) {
        return;
    }


    const total =
        subjects.length;


    dashboardStudyCount.textContent =
        `${total} matéria${total === 1 ? "" : "s"}`;

}


function updateDashboardEntertainment() {

    if (!dashboardEntertainmentCount) {
        return;
    }


    const total =
        savedMoviesCache.length +
        savedSeriesCache.length +
        animeLibraryCache.length;


    dashboardEntertainmentCount.textContent =
        `${total} salvo${total === 1 ? "" : "s"}`;

}


function updateDashboardFinance() {

    if (!dashboardFinanceBalance) {
        return;
    }


    const income =
        Number(
            financeIncome?.textContent
                ?.replace(/[^\d,-]/g, "")
                ?.replace(/\./g, "")
                ?.replace(",", ".")
        ) || 0;


    const expenses =
        Number(
            financeExpenses?.textContent
                ?.replace(/[^\d,-]/g, "")
                ?.replace(/\./g, "")
                ?.replace(",", ".")
        ) || 0;


    const balance =
        income - expenses;


    dashboardFinanceBalance.textContent =
        formatFinanceCurrency(balance);

}


function updateDashboard() {

    updateDashboardTasks();

    updateDashboardStudies();

    updateDashboardEntertainment();

    updateDashboardFinance();

}


if (dashboardFocusButton) {

    dashboardFocusButton.addEventListener(
        "click",
        () => {

            pages.forEach(
                (page) => {
                    page.classList.add("hidden");
                }
            );

            document
                .getElementById("tasks")
                .classList.remove("hidden");

            navItems.forEach(
                (item) => {

                    item.classList.remove(
                        "active"
                    );

                    if (
                        item.dataset.page ===
                        "tasks"
                    ) {

                        item.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );

}

/* =====================================================
   PROJETOS
===================================================== */

const addProjectButton =
    document.getElementById(
        "add-project-button"
    );

const emptyProjectButton =
    document.getElementById(
        "empty-project-button"
    );

const projectForm =
    document.getElementById(
        "project-form"
    );

const closeProjectForm =
    document.getElementById(
        "close-project-form"
    );

const cancelProject =
    document.getElementById(
        "cancel-project"
    );

const saveProjectButton =
    document.getElementById(
        "save-project"
    );

const projectName =
    document.getElementById(
        "project-name"
    );

const projectStatus =
    document.getElementById(
        "project-status"
    );

const projectProgress =
    document.getElementById(
        "project-progress"
    );

const projectDeadline =
    document.getElementById(
        "project-deadline"
    );

const projectDescription =
    document.getElementById(
        "project-description"
    );

const projectsContainer =
    document.getElementById(
        "projects-container"
    );

const totalProjects =
    document.getElementById(
        "total-projects"
    );

const activeProjects =
    document.getElementById(
        "active-projects"
    );

const finishedProjects =
    document.getElementById(
        "finished-projects"
    );

const averageProjectProgress =
    document.getElementById(
        "average-project-progress"
    );

const projectFilters =
    document.querySelectorAll(
        ".project-filter"
    );

const dashboardProjectCount =
    document.getElementById(
        "dashboard-project-count"
    );

const dashboardProjects =
    document.getElementById(
        "dashboard-projects"
    );

const dashboardProjectsLink =
    document.getElementById(
        "dashboard-projects-link"
    );


let projects = [];


let currentProjectFilter = "all";

let editingProjectId = null;


async function saveProjects() {
    try {
        const response = await fetch("/api/projects/sync", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projects })
        });
        if (!response.ok) throw new Error("Falha ao salvar projetos");
    } catch (error) {
        console.error("Erro ao salvar projetos:", error);
    }
}


function openProjectForm() {

    if (!projectForm) {
        return;
    }

    projectForm.classList.remove(
        "hidden"
    );

    projectName.focus();

}


function resetProjectForm() {

    projectName.value = "";

    projectStatus.value = "active";

    projectProgress.value = 0;

    projectDeadline.value = "";

    projectDescription.value = "";

}


function closeProjectFormFunction() {

    if (!projectForm) {
        return;
    }

    projectForm.classList.add(
        "hidden"
    );

    resetProjectForm();

    editingProjectId = null;

}


if (addProjectButton) {

    addProjectButton.addEventListener(
        "click",
        () => {

            editingProjectId = null;

            resetProjectForm();

            openProjectForm();

        }
    );

}


if (emptyProjectButton) {

    emptyProjectButton.addEventListener(
        "click",
        () => {

            editingProjectId = null;

            resetProjectForm();

            openProjectForm();

        }
    );

}


if (closeProjectForm) {

    closeProjectForm.addEventListener(
        "click",
        closeProjectFormFunction
    );

}


if (cancelProject) {

    cancelProject.addEventListener(
        "click",
        closeProjectFormFunction
    );

}


if (saveProjectButton) {

    saveProjectButton.addEventListener(
        "click",
        saveProject
    );

}


function saveProject() {

    const name =
        projectName.value.trim();

    const status =
        projectStatus.value;

    let progress =
        Number(projectProgress.value);

    const deadline =
        projectDeadline.value;

    const description =
        projectDescription.value.trim();


    if (name === "") {

        alert(
            "Digite um nome para o projeto."
        );

        return;

    }


    if (progress < 0) {
        progress = 0;
    }


    if (progress > 100) {
        progress = 100;
    }


    if (status === "completed") {
        progress = 100;
    }


    if (
        status === "active" &&
        progress === 100
    ) {

        progress = 99;

    }


    if (editingProjectId !== null) {

        const project =
            projects.find(
                (item) =>
                    item.id ===
                    editingProjectId
            );


        if (project) {

            project.name = name;

            project.status = status;

            project.progress = progress;

            project.deadline = deadline;

            project.description =
                description;

        }

    } else {

        projects.push({

            id: Date.now(),

            name,

            status,

            progress,

            deadline,

            description,

            createdAt:
                new Date().toISOString()

        });

    }


    saveProjects();

    renderProjects();

    renderDashboardProjects();

    updateProjectStats();

    closeProjectFormFunction();

}


projectFilters.forEach(
    (filterButton) => {

        filterButton.addEventListener(
            "click",
            () => {

                projectFilters.forEach(
                    (button) => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                filterButton.classList.add(
                    "active"
                );


                currentProjectFilter =
                    filterButton.dataset
                        .projectFilter;


                renderProjects();

            }
        );

    }
);


function renderProjects() {

    if (!projectsContainer) {
        return;
    }


    let filteredProjects =
        projects;


    if (
        currentProjectFilter !==
        "all"
    ) {

        filteredProjects =
            projects.filter(
                (project) =>
                    project.status ===
                    currentProjectFilter
            );

    }


    if (filteredProjects.length === 0) {

        projectsContainer.innerHTML = `

            <div class="empty-projects">

                <span>▣</span>

                <h3>
                    Nenhum projeto encontrado
                </h3>

                <p>
                    Crie um projeto para começar a acompanhar seu progresso.
                </p>

                <button
                    class="primary-button"
                    id="empty-project-button"
                >
                    + Criar projeto
                </button>

            </div>

        `;


        const button =
            document.getElementById(
                "empty-project-button"
            );


        button.addEventListener(
            "click",
            () => {

                editingProjectId = null;

                resetProjectForm();

                openProjectForm();

            }
        );


        return;

    }


    projectsContainer.innerHTML = "";


    filteredProjects.forEach(
        (project) => {

            projectsContainer.appendChild(
                createProjectCard(project)
            );

        }
    );

}


function createProjectCard(project) {

    const card =
        document.createElement("div");


    card.classList.add(
        "project-card"
    );


    let statusText =
        "Em andamento";


    if (project.status === "paused") {
        statusText = "Pausado";
    }


    if (project.status === "completed") {
        statusText = "Concluído";
    }


    let deadlineHTML =
        "Sem prazo";


    if (project.deadline) {

        const deadline =
            new Date(
                `${project.deadline}T12:00:00`
            );


        const formatted =
            deadline.toLocaleDateString(
                "pt-BR"
            );


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        deadline.setHours(
            0,
            0,
            0,
            0
        );


        const isOverdue =
            deadline < today &&
            project.status !==
                "completed";


        deadlineHTML = `

            <span
                class="${
                    isOverdue
                        ? "project-deadline overdue"
                        : "project-deadline"
                }"
            >
                📅 ${formatted}
            </span>

        `;

    }


    card.innerHTML = `

        <div class="project-card-header">

            <div>

                <div
                    class="project-card-title"
                    style="cursor: pointer;"
                >
                    ${escapeHTML(project.name)}
                </div>

                <div class="project-card-description">
                    ${
                        project.description
                            ? escapeHTML(
                                project.description
                            )
                            : "Sem descrição."
                    }
                </div>

            </div>


            <span
                class="project-status ${project.status}"
            >
                ${statusText}
            </span>

        </div>


        <div class="project-progress-info">

            <span>
                Progresso
            </span>

            <strong>
                ${project.progress}%
            </strong>

        </div>


        <div class="project-progress">

            <div
                class="project-progress-bar"
                style="width: ${project.progress}%"
            ></div>

        </div>


        <div class="project-card-footer">

            ${deadlineHTML}


            <div class="project-card-actions">

                <button
                    class="project-action edit-project"
                    title="Editar projeto"
                >
                    ✎
                </button>

                <button
                    class="project-action delete delete-project"
                    title="Excluir projeto"
                >
                    ×
                </button>

            </div>

        </div>

    `;


    const title =
        card.querySelector(
            ".project-card-title"
        );


    title.addEventListener(
        "click",
        () => {

            openProjectDetails(
                project.id
            );

        }
    );


    const editButton =
        card.querySelector(
            ".edit-project"
        );


    editButton.addEventListener(
        "click",
        () => {

            editProject(
                project.id
            );

        }
    );


    const deleteButton =
        card.querySelector(
            ".delete-project"
        );


    deleteButton.addEventListener(
        "click",
        () => {

            deleteProject(
                project.id
            );

        }
    );


    return card;

}


function editProject(id) {

    const project =
        projects.find(
            (item) =>
                item.id === id
        );


    if (!project) {
        return;
    }


    editingProjectId = id;


    projectName.value =
        project.name;

    projectStatus.value =
        project.status;

    projectProgress.value =
        project.progress;

    projectDeadline.value =
        project.deadline || "";

    projectDescription.value =
        project.description || "";


    openProjectForm();

}


function deleteProject(id) {

    const project =
        projects.find(
            (item) =>
                item.id === id
        );


    if (!project) {
        return;
    }


    const confirmed =
        confirm(
            `Excluir o projeto "${escapeHTML(project.name)}"?`
        );


    if (!confirmed) {
        return;
    }


    projects =
        projects.filter(
            (item) =>
                item.id !== id
        );


    projectTasks =
        projectTasks.filter(
            (task) =>
                task.projectId !== id
        );


    saveProjects();

    saveProjectTasks();

    renderProjects();

    renderDashboardProjects();

    updateProjectStats();

}


function updateProjectStats() {

    if (
        !totalProjects ||
        !activeProjects ||
        !finishedProjects ||
        !averageProjectProgress
    ) {
        return;
    }


    const total =
        projects.length;


    const active =
        projects.filter(
            (project) =>
                project.status ===
                "active"
        ).length;


    const completed =
        projects.filter(
            (project) =>
                project.status ===
                "completed"
        ).length;


    let average = 0;


    if (total > 0) {

        const sum =
            projects.reduce(
                (
                    totalProgress,
                    project
                ) => {

                    return (
                        totalProgress +
                        Number(
                            project.progress
                        )
                    );

                },
                0
            );


        average =
            Math.round(
                sum / total
            );

    }


    totalProjects.textContent =
        total;

    activeProjects.textContent =
        active;

    finishedProjects.textContent =
        completed;

    averageProjectProgress.textContent =
        `${average}%`;


    if (dashboardProjectCount) {

        dashboardProjectCount.textContent =
            `${active} ativo${active === 1 ? "" : "s"}`;

    }

}


function renderDashboardProjects() {

    if (!dashboardProjects) {
        return;
    }


    if (projects.length === 0) {

        dashboardProjects.innerHTML = `

            <div class="empty-dashboard-projects">

                <span>▣</span>

                <p>
                    Nenhum projeto criado ainda.
                </p>

            </div>

        `;

        return;

    }


    const dashboardList =
        projects
            .filter(
                (project) =>
                    project.status !==
                    "completed"
            )
            .slice(0, 4);


    if (dashboardList.length === 0) {

        dashboardProjects.innerHTML = `

            <div class="empty-dashboard-projects">

                <span>✓</span>

                <p>
                    Todos os projetos foram concluídos.
                </p>

            </div>

        `;

        return;

    }


    dashboardProjects.innerHTML = "";


    dashboardList.forEach(
        (project) => {

            const item =
                document.createElement("div");


            item.classList.add(
                "project-item"
            );


            item.innerHTML = `

                <div class="project-info">

                    <span>
                        ${escapeHTML(
                            project.name
                        )}
                    </span>

                    <strong>
                        ${project.progress}%
                    </strong>

                </div>

                <div class="progress">

                    <div
                        class="progress-bar"
                        style="width: ${project.progress}%"
                    ></div>

                </div>

            `;


            dashboardProjects.appendChild(
                item
            );

        }
    );

}

function renderDashboardAgenda() {

    const dashboardAgenda =
        document.getElementById(
            "dashboard-agenda"
        );

    if (!dashboardAgenda) {
        return;
    }


    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const upcomingEvents =
        events
            .filter(
                (event) => {

                    const eventDate =
                        new Date(
                            `${event.date}T00:00:00`
                        );

                    return (
                        eventOccursOnDate(
                            event,
                            eventDate
                        ) &&
                        eventDate >= today
                    );

                }
            )
            .sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            `${a.date}T${a.start || "00:00"}`
                        );

                    const dateB =
                        new Date(
                            `${b.date}T${b.start || "00:00"}`
                        );

                    return dateA - dateB;

                }
            )
            .slice(0, 5);


    if (upcomingEvents.length === 0) {

        dashboardAgenda.innerHTML = `

            <div class="empty-dashboard-agenda">

                <span>◷</span>

                <p>
                    Nenhum compromisso próximo.
                </p>

            </div>

        `;

        return;

    }


    dashboardAgenda.innerHTML = "";


    upcomingEvents.forEach(
        (event) => {

            const item =
                document.createElement("div");


            item.classList.add(
                "dashboard-agenda-item"
            );


            const eventDate =
                new Date(
                    `${event.date}T00:00:00`
                );


            const todayDate =
                new Date();

            todayDate.setHours(
                0,
                0,
                0,
                0
            );


            const tomorrowDate =
                new Date(todayDate);

            tomorrowDate.setDate(
                tomorrowDate.getDate() + 1
            );


            let dateLabel;


            if (
                eventDate.getTime() ===
                todayDate.getTime()
            ) {

                dateLabel = "Hoje";

            } else if (
                eventDate.getTime() ===
                tomorrowDate.getTime()
            ) {

                dateLabel = "Amanhã";

            } else {

                dateLabel =
                    eventDate.toLocaleDateString(
                        "pt-BR",
                        {
                            day: "2-digit",
                            month: "2-digit"
                        }
                    );

            }


            item.innerHTML = `

                <span class="dashboard-agenda-time">
                    ${escapeHTML(
                        event.start || "--:--"
                    )}
                </span>


                <div class="dashboard-agenda-content">

                    <span class="dashboard-agenda-title">
                        ${escapeHTML(
                            event.title
                        )}
                    </span>


                    <span class="dashboard-agenda-date">
                        ${dateLabel}
                    </span>

                    ${
                        event.notes
                            ? `
                                <p class="dashboard-agenda-notes">
                                    ${escapeHTML(
                                        event.notes
                                    )}
                                </p>
                              `
                            : ""
                    }

                </div>

            `;


            dashboardAgenda.appendChild(
                item
            );

        }
    );

}

const dashboardAgendaLink =
    document.getElementById(
        "dashboard-agenda-link"
    );


if (dashboardAgendaLink) {

    dashboardAgendaLink.addEventListener(
        "click",
        (event) => {

            event.preventDefault();


            pages.forEach(
                (page) => {

                    page.classList.add(
                        "hidden"
                    );

                }
            );


            const calendarPage =
                document.getElementById(
                    "calendar"
                );


            if (calendarPage) {

                calendarPage.classList.remove(
                    "hidden"
                );

            }


            navItems.forEach(
                (item) => {

                    item.classList.remove(
                        "active"
                    );


                    if (
                        item.dataset.page ===
                        "calendar"
                    ) {

                        item.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


if (dashboardProjectsLink) {

    dashboardProjectsLink.addEventListener(
        "click",
        (event) => {

            event.preventDefault();


            pages.forEach(
                (page) => {

                    page.classList.add(
                        "hidden"
                    );

                }
            );


            document
                .getElementById("projects")
                .classList.remove(
                    "hidden"
                );


            navItems.forEach(
                (item) => {

                    item.classList.remove(
                        "active"
                    );


                    if (
                        item.dataset.page ===
                        "projects"
                    ) {

                        item.classList.add(
                            "active"
                        );

                    }

                }
            );

        }
    );

}


/* =====================================================
   MODAL DO PROJETO
===================================================== */

const projectModal =
    document.getElementById(
        "project-modal"
    );

const closeProjectModal =
    document.getElementById(
        "close-project-modal"
    );

const modalProjectName =
    document.getElementById(
        "modal-project-name"
    );

const modalProjectDescription =
    document.getElementById(
        "modal-project-description"
    );

const modalProjectProgress =
    document.getElementById(
        "modal-project-progress"
    );

const modalProjectProgressBar =
    document.getElementById(
        "modal-project-progress-bar"
    );

const modalTaskCount =
    document.getElementById(
        "modal-task-count"
    );

const addProjectTask =
    document.getElementById(
        "add-project-task"
    );

const projectTaskForm =
    document.getElementById(
        "project-task-form"
    );

const projectTaskTitle =
    document.getElementById(
        "project-task-title"
    );

const saveProjectTask =
    document.getElementById(
        "save-project-task"
    );

const projectTasksContainer =
    document.getElementById(
        "project-tasks-container"
    );


let currentProjectId = null;


let projectTasks = [];


async function saveProjectTasks() {
    try {
        const response = await fetch("/api/project-tasks/sync", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectTasks })
        });
        if (!response.ok) throw new Error("Falha ao salvar tarefas dos projetos");
    } catch (error) {
        console.error("Erro ao salvar tarefas dos projetos:", error);
    }
}


function openProjectDetails(id) {

    const project =
        projects.find(
            (item) =>
                item.id === id
        );


    if (!project) {
        return;
    }


    currentProjectId = id;


    modalProjectName.textContent =
        project.name;


    modalProjectDescription.textContent =
        project.description ||
        "Sem descrição.";


    projectModal.classList.remove(
        "hidden"
    );


    renderProjectTasks();

}


if (closeProjectModal) {

    closeProjectModal.addEventListener(
        "click",
        closeProjectDetails
    );

}


if (projectModal) {

    projectModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                projectModal
            ) {

                closeProjectDetails();

            }

        }
    );

}


function closeProjectDetails() {

    projectModal.classList.add(
        "hidden"
    );

    currentProjectId = null;

    projectTaskForm.classList.add(
        "hidden"
    );

    projectTaskTitle.value = "";

}


if (addProjectTask) {

    addProjectTask.addEventListener(
        "click",
        () => {

            projectTaskForm.classList.toggle(
                "hidden"
            );


            if (
                !projectTaskForm.classList.contains(
                    "hidden"
                )
            ) {

                projectTaskTitle.focus();

            }

        }
    );

}


if (saveProjectTask) {

    saveProjectTask.addEventListener(
        "click",
        addProjectTaskFunction
    );

}


if (projectTaskTitle) {

    projectTaskTitle.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter"
            ) {

                addProjectTaskFunction();

            }

        }
    );

}


function addProjectTaskFunction() {

    if (
        currentProjectId === null
    ) {

        return;

    }


    const title =
        projectTaskTitle.value.trim();


    if (title === "") {

        return;

    }


    projectTasks.push({

        id: Date.now(),

        projectId:
            currentProjectId,

        title,

        completed: false

    });


    saveProjectTasks();


    projectTaskTitle.value = "";


    projectTaskForm.classList.add(
        "hidden"
    );


    renderProjectTasks();

}


function renderProjectTasks() {

    if (
        !projectTasksContainer ||
        currentProjectId === null
    ) {

        return;

    }


    const tasks =
        projectTasks.filter(
            (task) =>
                task.projectId ===
                currentProjectId
        );


    const completed =
        tasks.filter(
            (task) =>
                task.completed
        ).length;


    modalTaskCount.textContent =
        `${completed} de ${tasks.length} concluídas`;


    if (tasks.length === 0) {

        projectTasksContainer.innerHTML = `

            <div class="empty-project-tasks">

                <span>✓</span>

                <p>
                    Nenhuma tarefa neste projeto.
                </p>

            </div>

        `;


        updateProjectProgress();

        return;

    }


    projectTasksContainer.innerHTML = "";


    tasks.forEach(
        (task) => {

            const element =
                document.createElement(
                    "div"
                );


            element.classList.add(
                "project-task"
            );


            if (task.completed) {

                element.classList.add(
                    "completed"
                );

            }


            element.innerHTML = `

                <input
                    type="checkbox"
                    class="project-task-checkbox"
                    ${task.completed ? "checked" : ""}
                >

                <span class="project-task-title">
                    ${escapeHTML(
                        task.title
                    )}
                </span>

                <button
                    class="delete-project-task"
                    title="Excluir tarefa"
                >
                    ×
                </button>

            `;


            const checkbox =
                element.querySelector(
                    ".project-task-checkbox"
                );


            checkbox.addEventListener(
                "change",
                () => {

                    task.completed =
                        checkbox.checked;

                    saveProjectTasks();

                    renderProjectTasks();

                }
            );


            const deleteButton =
                element.querySelector(
                    ".delete-project-task"
                );


            deleteButton.addEventListener(
                "click",
                () => {

                    projectTasks =
                        projectTasks.filter(
                            (item) =>
                                item.id !==
                                task.id
                        );


                    saveProjectTasks();

                    renderProjectTasks();

                }
            );


            projectTasksContainer.appendChild(
                element
            );

        }
    );


    updateProjectProgress();

}


function updateProjectProgress() {

    if (
        currentProjectId === null
    ) {

        return;

    }


    const project =
        projects.find(
            (item) =>
                item.id ===
                currentProjectId
        );


    if (!project) {
        return;
    }


    const tasks =
        projectTasks.filter(
            (task) =>
                task.projectId ===
                currentProjectId
        );


    const completed =
        tasks.filter(
            (task) =>
                task.completed
        ).length;


    let progress = 0;


    if (tasks.length > 0) {

        progress =
            Math.round(
                (
                    completed /
                    tasks.length
                ) * 100
            );

    }


    project.progress =
        progress;


    if (
        progress === 100 &&
        tasks.length > 0
    ) {

        project.status =
            "completed";

    } else if (
        project.status ===
        "completed"
    ) {

        project.status =
            "active";

    }


    if (modalProjectProgress) {

        modalProjectProgress.textContent =
            `${progress}%`;

    }


    if (modalProjectProgressBar) {

        modalProjectProgressBar.style.width =
            `${progress}%`;

    }


    saveProjects();

    renderProjects();

    renderDashboardProjects();

    updateProjectStats();

}


/* =====================================================
   SEGURANÇA
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

let orbitLoadedUserId = null;
let orbitLoadingPromise = null;

async function loadOrbitUserData() {
    if (orbitLoadingPromise) {
        return orbitLoadingPromise;
    }

    orbitLoadingPromise = (async () => {
        try {
            await window.orbitAuthReady;

            const userId = window.orbitUserId;
            if (!userId) {
                return;
            }

            if (orbitLoadedUserId === userId) {
                loadSubjectsForUser(userId);
                return;
            }

            loadSubjectsForUser(userId);

        const [tasksResponse, eventsResponse, projectsResponse, projectTasksResponse] =
            await Promise.all([
                fetch("/api/tasks"),
                fetch("/api/events"),
                fetch("/api/projects"),
                fetch("/api/project-tasks")
            ]);

        if (![tasksResponse, eventsResponse, projectsResponse, projectTasksResponse].every(response => response.ok)) {
            throw new Error("Não foi possível carregar os dados da conta");
        }

        const [tasksResult, eventsResult, projectsResult, projectTasksResult] =
            await Promise.all([
                tasksResponse.json(),
                eventsResponse.json(),
                projectsResponse.json(),
                projectTasksResponse.json()
            ]);

        tasks = tasksResult.tasks || [];
        events = eventsResult.events || [];
        projects = projectsResult.projects || [];
        projectTasks = projectTasksResult.projectTasks || [];

        // Migra dados antigos deste navegador apenas uma vez, para a primeira
        // conta que os importar. Depois disso os dados ficam exclusivamente
        // no backend e não podem vazar para outra conta no mesmo navegador.
        const legacyMigrationKey = "orbitLegacyBackendMigrationDone";
        if (!localStorage.getItem(legacyMigrationKey)) {
            const localTasks = parseLocalStorageArray("orbitTasks");
            const localEvents = parseLocalStorageArray("orbitEvents");
            const localProjects = parseLocalStorageArray("orbitProjects");
            const localProjectTasks = parseLocalStorageArray("orbitProjectTasks");

            if (tasks.length === 0 && localTasks.length) {
                tasks = localTasks;
                await saveTasks();
            }

            if (events.length === 0 && localEvents.length) {
                events = localEvents;
                await saveEvents();
            }

            if (projects.length === 0 && localProjects.length) {
                projects = localProjects;
                await saveProjects();
            }

            if (projectTasks.length === 0 && localProjectTasks.length) {
                projectTasks = localProjectTasks;
                await saveProjectTasks();
            }

            [
                "orbitTasks",
                "orbitEvents",
                "orbitProjects",
                "orbitProjectTasks"
            ].forEach((key) => localStorage.removeItem(key));

            localStorage.setItem(legacyMigrationKey, "1");
        }

        renderTasks();
        updateDashboardTasks();
        updateCalendarHeader();
        renderProjects();
        updateProjectStats();
        renderDashboardProjects();
        renderDashboardAgenda();

            if (getNotificationSettings().enabled) {
                events.forEach(event => scheduleReminder(event));
            }
            orbitLoadedUserId = userId;
        } catch (error) {
            console.error("Erro ao carregar dados do ORBIT:", error);
            alert("Não foi possível carregar os dados da sua conta. Verifique o servidor e tente novamente.");
        } finally {
            orbitLoadingPromise = null;
        }
    })();

    return orbitLoadingPromise;
}

loadOrbitUserData();

window.addEventListener("orbit:auth-changed", async (event) => {
    const user = event.detail?.user || null;

    if (!user) {
        orbitLoadedUserId = null;
        tasks = [];
        events = [];
        projects = [];
        projectTasks = [];
        subjects = [];
        currentStudyStorageKey = null;
        savedMoviesCache = [];
        savedSeriesCache = [];
        animeLibraryCache = [];
        financeData = [];
        games = [];

        renderTasks();
        renderProjects();
        renderDashboardProjects();
        renderDashboardAgenda();
        renderSubjects();
        renderMovieLibrary();
        renderSeriesLibrary();
        renderAnimeLibrary();
        renderFinance();
        renderGames();
        return;
    }

    await loadOrbitUserData();

    // Alguns módulos carregam dados protegidos durante a inicialização.
    // Recarregamos aqui para cobrir login sem recarregar a página.
    await Promise.allSettled([
        loadSavedSteamId(),
        loadMovieLibrary(),
        loadSeriesLibrary(),
        loadAnimeLibrary(),
        loadFinance()
    ]);
});

const mobileMoreButton = document.getElementById("mobile-more-button");
const mobileMoreMenu = document.getElementById("mobile-more-menu");

mobileMoreButton?.addEventListener("click", (event) => {
    event.preventDefault();

    mobileMoreMenu?.classList.toggle("open");
});

mobileMoreItems.forEach((item) => {
    item.addEventListener("click", (event) => {
        event.preventDefault();
        navigateToPage(item.dataset.page, item);
        mobileMoreButton.classList.add("active");
    });
});

/* =====================================================
   JOGOS
===================================================== */

const totalGames =
    document.getElementById("total-games");

const recentGames =
    document.getElementById("recent-games");

const totalAchievements =
    document.getElementById("total-achievements");

const totalPlaytime =
    document.getElementById("total-playtime");

const gamesContainer =
    document.getElementById("games-container");


let games = [];

loadSavedSteamId();


// =========================
// CONEXÃO COM STEAM
// =========================

const steamIdInput =
    document.getElementById("steam-id-input");

const connectSteamButton =
    document.getElementById("connect-steam-button");

let currentSteamId = null;


connectSteamButton.addEventListener(
    "click",
    async () => {

        const steamId =
            steamIdInput.value.trim();

        if (!steamId) {
            alert("Informe seu SteamID64.");
            return;
        }

        try {

            connectSteamButton.disabled = true;
            connectSteamButton.textContent = "Salvando...";

            const response =
                await fetch(
                    "/api/user/steam-id",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            steamId: steamId
                        })
                    }
                );

            const result =
                await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Não foi possível salvar o Steam ID"
                );
            }

            currentSteamId =
                result.steamId;

            steamIdInput.value =
                currentSteamId;

            await loadSteamGames(
                currentSteamId
            );

        } catch (error) {

            console.error(
                "Erro ao salvar Steam ID:",
                error
            );

            alert(
                error.message ||
                "Não foi possível conectar a Steam."
            );

        } finally {

            connectSteamButton.disabled = false;
            connectSteamButton.textContent = "Conectar Steam";

        }

    }
);


// =========================
// CARREGAR STEAM ID SALVO
// =========================

async function loadSavedSteamId() {

    try {

        const response =
            await fetch(
                "/api/user/steam-id"
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Não foi possível buscar o Steam ID"
            );
        }

        if (!result.steamId) {
            return;
        }

        currentSteamId =
            result.steamId;

        steamIdInput.value =
            currentSteamId;

        await loadSteamGames(
            currentSteamId
        );

    } catch (error) {

        console.error(
            "Erro ao carregar Steam ID salvo:",
            error
        );

    }

}



async function loadSteamGames(steamId) {

    console.log("SteamID usado:", steamId);

    try {

        const response =
    await fetch(
        `http://localhost:3000/api/steam/games?steamId=${steamId}`
    );
        const result =
            await response.json();

        if (!result.success) {
            throw new Error(
                result.message || "Erro ao buscar jogos"
            );
        }

        games =
            result.data.games || [];

        console.log("Jogos recebidos da Steam:", result.data);
        console.log("Quantidade de jogos:", games.length);

        renderGames();

        if (totalGames) {
            totalGames.textContent =
                games.length;
        }

        if (recentGames) {
            recentGames.textContent =
                games.filter(
                    (game) => game.playtime_2weeks > 0
                ).length;
        }

        if (totalPlaytime) {

            const totalMinutes =
                games.reduce(
                    (total, game) =>
                        total + (game.playtime_forever || 0),
                    0
                );

            totalPlaytime.textContent =
                Math.round(totalMinutes / 60) + "h";
        }

    } catch (error) {

        console.error(
            "Erro ao carregar jogos da Steam:",
            error
        );

    }

}



async function loadGameAchievements(steamId, appId) {

    try {

        const response = await fetch(
            `/api/steam/achievements?steamId=${steamId}&appId=${appId}`
        );

        const result = await response.json();

        if (!result.success || !result.data) {
            return null;
        }

        const achievements =
            result.data.achievements || [];

        const total =
            achievements.length;

        const unlocked =
            achievements.filter(
                (achievement) =>
                    achievement.achieved === 1
            ).length;

        return {
            total,
            unlocked
        };

    } catch (error) {

        console.error(
            `Erro ao carregar conquistas do jogo ${appId}:`,
            error
        );

        return null;
    }
}


function renderGames() {

    if (!gamesContainer) {
        return;
    }

    gamesContainer.innerHTML = "";

    if (games.length === 0) {

        gamesContainer.innerHTML = `

            <div class="no-games">

                <h3>
                    Nenhum jogo encontrado
                </h3>

                <p>
                    Não encontramos jogos nessa conta Steam.
                </p>

            </div>

        `;

        return;
    }


     games
        .sort((a, b) => {
            return (b.playtime_forever || 0) - (a.playtime_forever || 0);
        })
        .forEach(async (game) => {

        const playtimeHours =
            Math.round(
                (game.playtime_forever || 0) / 60
            );


        const coverUrl =
            `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;


        const card =
            document.createElement("div");

        card.className = "game-card";


        card.innerHTML = `

            <div class="game-cover">

                <img
                    src="${coverUrl}"
                    alt="${game.name}"
                >

            </div>


            <div class="game-info">

                <h3>
                    ${game.name}
                </h3>

                <span class="game-platform">
                    Steam
                </span>


                <div class="game-stats">

                <span>
                    ⏱ ${playtimeHours}h
                </span>

            </div>

            <div class="game-achievement">

                <div class="game-achievement-header">

                    <span>
                        🏆 Conquistas
                    </span>

                    <strong class="achievement-value">
                        Carregando...
                    </strong>

                </div>

            </div>

        `;


        gamesContainer.appendChild(card);

        const achievementElement =
            card.querySelector(".achievement-value");

        const achievements =
            await loadGameAchievements(
               currentSteamId,
                game.appid
            );

        if (!achievements) {

            achievementElement.textContent =
                "Sem dados";

        } else {

            achievementElement.textContent =
                `${achievements.unlocked} / ${achievements.total}`;
        }

    });

}


if (
    totalGames &&
    recentGames &&
    totalAchievements &&
    totalPlaytime
) {

    totalGames.textContent =
        games.length;

    recentGames.textContent =
        games.length;

    totalAchievements.textContent =
        games.reduce(
            (total, game) =>
                total + game.achievementsUnlocked,
            0
        );

    totalPlaytime.textContent =
        games.reduce(
            (total, game) =>
                total + game.playtime,
            0
        ) + "h";

    renderGames();

}

// =========================
// ESTUDOS
// =========================

const addSubjectButton =
    document.getElementById("add-subject-button");

const subjectForm =
    document.getElementById("subject-form");

const subjectName =
    document.getElementById("subject-name");

const saveSubjectButton =
    document.getElementById("save-subject");

const subjectsContainer =
    document.getElementById("subjects-container");


let subjects = [];

let currentStudySubjectId = null;
let currentStudyStorageKey = null;

function parseLocalStorageArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.warn(`Dados locais inválidos em ${key}:`, error);
        return [];
    }
}

function getStudyStorageKey(userId = window.orbitUserId) {
    return userId ? `orbitStudies:${userId}` : null;
}

function loadSubjectsForUser(userId) {
    const key = getStudyStorageKey(userId);

    if (!key) {
        subjects = [];
        currentStudyStorageKey = null;
        return;
    }

    currentStudyStorageKey = key;
    subjects = parseLocalStorageArray(key).map((subject) => ({
        ...subject,
        id: Number(subject.id) || Date.now(),
        name: String(subject.name || "Matéria"),
        files: Array.isArray(subject.files) ? subject.files : [],
        notes: Array.isArray(subject.notes) ? subject.notes : [],
        topics: Array.isArray(subject.topics) ? subject.topics : [],
        studyHours: Number(subject.studyHours) || 0
    }));

    // Migração única do formato antigo, que não separava as contas.
    const legacyKey = "orbitStudies";
    const legacyMigrationKey = `orbitStudiesMigrated:${userId}`;

    if (!subjects.length && !localStorage.getItem(legacyMigrationKey)) {
        const legacySubjects = parseLocalStorageArray(legacyKey);
        if (legacySubjects.length) {
            subjects = legacySubjects.map((subject) => ({
                ...subject,
                id: Number(subject.id) || Date.now(),
                name: String(subject.name || "Matéria"),
                files: Array.isArray(subject.files) ? subject.files : [],
                notes: Array.isArray(subject.notes) ? subject.notes : [],
                topics: Array.isArray(subject.topics) ? subject.topics : [],
                studyHours: Number(subject.studyHours) || 0
            }));
            localStorage.setItem(key, JSON.stringify(subjects));
            localStorage.removeItem(legacyKey);
        }
        localStorage.setItem(legacyMigrationKey, "1");
    }

    renderSubjects();
    updateDashboardStudies();
}

function saveSubjects() {
    if (!currentStudyStorageKey) {
        return;
    }

    localStorage.setItem(
        currentStudyStorageKey,
        JSON.stringify(subjects)
    );
}


addSubjectButton.addEventListener(
    "click",
    () => {

        subjectForm.classList.toggle("hidden");

        if (!subjectForm.classList.contains("hidden")) {
            subjectName.focus();
        }

    }
);


saveSubjectButton.addEventListener(
    "click",
    addSubject
);


subjectName.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            addSubject();
        }

    }
);


function addSubject() {

    const name =
        subjectName.value.trim();

    if (!name) {
        return;
    }


    const newSubject = {

        id: Date.now(),

        name: name,

        files: [],

        notes: "",

        topics: [],

        studyHours: 0

    };


    subjects.push(newSubject);

    saveSubjects();

    renderSubjects();

    updateDashboardStudies();

    subjectName.value = "";

    subjectForm.classList.add("hidden");

}


function renderSubjects() {

    if (subjects.length === 0) {

        subjectsContainer.innerHTML = `
            <div class="empty-subjects">

                <span>
                    📚
                </span>

                <h3>
                    Nenhuma matéria ainda
                </h3>

                <p>
                    Crie sua primeira matéria para começar.
                </p>

            </div>
        `;

        return;
    }


    subjectsContainer.innerHTML =
        subjects.map(
            (subject) => `

                <div
                    class="subject-card"
                    data-subject-id="${subject.id}"
                >

                    <div class="subject-card-icon">
                        📚
                    </div>

                    <div class="subject-card-info">

                        <h3>
                            ${escapeHTML(subject.name)}
                        </h3>

                        <p>
                            ${Array.isArray(subject.files) ? subject.files.length : 0} arquivo${(Array.isArray(subject.files) ? subject.files.length : 0) === 1 ? "" : "s"}
                        </p>

                    </div>

                    <button
                        class="subject-remove"
                        data-subject-id="${subject.id}"
                        title="Remover matéria"
                    >
                        🗑️
                    </button>

                </div>

            `
        ).join("");

}

renderSubjects();

updateDashboardStudies();

subjectsContainer.addEventListener(
    "click",
    async (event) => {

        const removeButton =
            event.target.closest(".subject-remove");

        if (removeButton) {

            event.stopPropagation();

            const subjectId =
                Number(removeButton.dataset.subjectId);

            const confirmed =
                confirm(
                    "Tem certeza que deseja remover esta matéria?"
                );

            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(
                    `/api/studies/files/subject/${subjectId}`,
                    { method: "DELETE" }
                );

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        "Não foi possível remover os arquivos da matéria."
                    );
                }
            } catch (error) {
                console.error("Erro ao limpar arquivos da matéria:", error);
                alert(error.message || "Não foi possível remover a matéria.");
                return;
            }

            subjects =
                subjects.filter(
                    (subject) =>
                        subject.id !== subjectId
                );

            saveSubjects();
            renderSubjects();
            updateDashboardStudies();

            return;
        }


        const card =
            event.target.closest(".subject-card");

        if (!card) {
            return;
        }


        const subjectId =
            Number(card.dataset.subjectId);


        openStudySubject(subjectId);

    }
);

function openStudySubject(subjectId) {

    const subject =
        subjects.find(
            (item) => item.id === subjectId
        );

    if (!subject) {
        return;
    }

    currentStudySubjectId =
    subjectId;


    const modal =
        document.getElementById(
            "study-subject-modal"
        );

    const title =
        document.getElementById(
            "study-subject-title"
        );


    title.textContent =
        subject.name;


    if (!Array.isArray(subject.notes)) {
        subject.notes = [];
        saveSubjects();
    }


    renderStudyNotes(subject);

    renderStudyTopics(subject);

    loadStudyFiles(subject.id);


    modal.classList.remove("hidden");

}

const studyFilesSearchInput =
    document.getElementById(
        "study-files-search-input"
    );

const topicsContainer =
    document.getElementById(
        "study-topics-container"
    );

async function loadStudyFiles(subjectId) {

    const filesContainer =
        document.getElementById(
            "study-files-container"
        );

    if (!filesContainer) {
        return;
    }


    filesContainer.innerHTML = `
        <p>
            Carregando arquivos...
        </p>
    `;


    try {

        const response =
            await fetch(
                `/api/studies/files/${subjectId}`
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Erro ao buscar arquivos"
            );

        }


        const subject = subjects.find(
            (item) => item.id === Number(subjectId)
        );

        if (subject) {
            subject.files = Array.isArray(result.files) ? result.files : [];
            saveSubjects();
            renderSubjects();
        }

        renderStudyFiles(
            result.files
        );


    } catch (error) {

        console.error(
            "Erro ao carregar arquivos:",
            error
        );


        filesContainer.innerHTML = `
            <div class="empty-study-files">

                <span>
                    ⚠️
                </span>

                <h3>
                    Não foi possível carregar os arquivos
                </h3>

            </div>
        `;

    }

}

function renderStudyFiles(files) {

    const filesContainer =
        document.getElementById(
            "study-files-container"
        );


    if (!files || files.length === 0) {

        filesContainer.innerHTML = `
            <div class="empty-study-files">

                <span>
                    📁
                </span>

                <h3>
                    Nenhum arquivo ainda
                </h3>

                <p>
                    Adicione materiais para esta matéria.
                </p>

            </div>
        `;

        return;
    }


    filesContainer.innerHTML =
        files.map(
            (file) => `

                <div
                    class="study-file-card"
                    data-file-id="${file.id}"
                >

                    <div class="study-file-info">

                        <span class="study-file-icon">
                            📄
                        </span>

                        <div>

                            <h4>
                                ${escapeHTML(file.title)}
                            </h4>

                            <p>
                                ${escapeHTML(file.file_name)}
                            </p>

                        </div>

                    </div>


                    <div class="study-file-actions">

                        <button
                            class="study-file-open"
                            data-file-id="${file.id}"
                        >
                            Abrir
                        </button>

                        <button
                            class="study-file-remove"
                            data-file-id="${file.id}"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

            `
        ).join("");


    filesContainer
        .querySelectorAll(
            ".study-file-open"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const fileId =
                            button.dataset.fileId;


                        try {

                            button.disabled =
                                true;

                            button.textContent =
                                "Abrindo...";


                            const response =
                                await fetch(
                                    `/api/studies/file/${fileId}`
                                );


                            const result =
                                await response.json();


                            if (!response.ok) {

                                throw new Error(
                                    result.message ||
                                    "Erro ao abrir arquivo"
                                );

                            }


                            window.open(
                                result.url,
                                "_blank"
                            );


                        } catch (error) {

                            console.error(
                                "Erro ao abrir arquivo:",
                                error
                            );

                            alert(
                                "Não foi possível abrir o arquivo."
                            );

                        } finally {

                            button.disabled =
                                false;

                            button.textContent =
                                "Abrir";

                        }

                    }
                );

            }
        );


    filesContainer
        .querySelectorAll(
            ".study-file-remove"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async () => {

                        const fileId =
                            button.dataset.fileId;


                        const confirmed =
                            confirm(
                                "Tem certeza que deseja remover este arquivo?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        try {

                            button.disabled =
                                true;

                            button.textContent =
                                "Removendo...";


                            const response =
                                await fetch(
                                    `/api/studies/file/${fileId}`,
                                    {
                                        method: "DELETE"
                                    }
                                );


                            const result =
                                await response.json();


                            if (!response.ok) {

                                throw new Error(
                                    result.message ||
                                    "Erro ao remover arquivo"
                                );

                            }


                            loadStudyFiles(
                                currentStudySubjectId
                            );


                        } catch (error) {

                            console.error(
                                "Erro ao remover arquivo:",
                                error
                            );

                            alert(
                                "Não foi possível remover o arquivo."
                            );


                            button.disabled =
                                false;

                            button.textContent =
                                "🗑️";

                        }

                    }
                );

            }
        );

}

studyFilesSearchInput.addEventListener(
    "input",
    () => {

        const search =
            studyFilesSearchInput.value
                .trim()
                .toLowerCase();

        const subjectId =
            currentStudySubjectId;


        fetch(
            `/api/studies/files/${subjectId}`
        )
            .then(
                (response) =>
                    response.json()
            )
            .then(
                (result) => {

                    if (!result.success) {
                        return;
                    }


                    const filteredFiles =
                        result.files.filter(
                            (file) =>
                                file.title
                                    .toLowerCase()
                                    .includes(search) ||

                                file.file_name
                                    .toLowerCase()
                                    .includes(search)
                        );


                    renderStudyFiles(
                        filteredFiles
                    );

                }
            )
            .catch(
                (error) => {

                    console.error(
                        "Erro ao pesquisar arquivos:",
                        error
                    );

                }
            );

    }
);

function renderStudyNotes(subject) {

    const notesContainer =
        document.getElementById(
            "study-notes-container"
        );

    if (!subject.notes.length) {

        notesContainer.innerHTML = `
            <div class="empty-study-notes">

                <span>
                    📝
                </span>

                <h3>
                    Nenhuma anotação ainda
                </h3>

                <p>
                    Crie sua primeira anotação.
                </p>

            </div>
        `;

        return;
    }


    notesContainer.innerHTML =
        subject.notes.map(
            (note) => `

                <div
                    class="study-note-card"
                    data-note-id="${note.id}"
                >

                    <div class="study-note-card-content">

                        <h4>
                            ${escapeHTML(note.title)}
                        </h4>

                        <p>
                            ${escapeHTML(note.content)}
                        </p>

                    </div>

                    <button
                        class="study-note-remove"
                        data-note-id="${note.id}"
                    >
                        🗑️
                    </button>

                </div>

            `
        ).join("");


    notesContainer
        .querySelectorAll(".study-note-remove")
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const noteId =
                            Number(
                                button.dataset.noteId
                            );

                        subject.notes =
                            subject.notes.filter(
                                (note) =>
                                    note.id !== noteId
                            );

                        saveSubjects();

                        renderStudyNotes(subject);

                    }
                );

            }
        );

}


function renderFilteredStudyNotes(notes) {

    const notesContainer =
        document.getElementById(
            "study-notes-container"
        );

    if (!notes.length) {

        notesContainer.innerHTML = `
            <div class="empty-study-notes">

                <span>
                    🔍
                </span>

                <h3>
                    Nenhuma anotação encontrada
                </h3>

                <p>
                    Tente pesquisar outro termo.
                </p>

            </div>
        `;

        return;
    }

    notesContainer.innerHTML =
        notes.map(
            (note) => `

                <div
                    class="study-note-card"
                    data-note-id="${note.id}"
                >

                    <div class="study-note-card-content">

                        <h4>
                            ${escapeHTML(note.title)}
                        </h4>

                        <p>
                            ${escapeHTML(note.content)}
                        </p>

                    </div>

                    <button
                        class="study-note-remove"
                        data-note-id="${note.id}"
                    >
                        🗑️
                    </button>

                </div>

            `
        ).join("");


    notesContainer
        .querySelectorAll(
            ".study-note-remove"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const noteId =
                            Number(
                                button.dataset.noteId
                            );

                        const subject =
                            subjects.find(
                                (item) =>
                                    item.id ===
                                    currentStudySubjectId
                            );

                        if (!subject) {
                            return;
                        }

                        subject.notes =
                            subject.notes.filter(
                                (note) =>
                                    note.id !== noteId
                            );

                        saveSubjects();

                        renderStudyNotes(
                            subject
                        );

                    }
                );

            }
        );

}

const addStudyNoteButton =
    document.getElementById(
        "add-study-note-button"
    );

const studyNoteForm =
    document.getElementById(
        "study-note-form"
    );

const studyNoteTitle =
    document.getElementById(
        "study-note-title"
    );

const studyNoteContent =
    document.getElementById(
        "study-note-content"
    );

const saveStudyNoteButton =
    document.getElementById(
        "save-study-note"
    );

const cancelStudyNoteButton =
    document.getElementById(
        "cancel-study-note"
    );

const studyNotesSearchInput =
    document.getElementById(
        "study-notes-search-input"
    );


addStudyNoteButton.addEventListener(
    "click",
    () => {

        studyNoteForm.classList.remove(
            "hidden"
        );

        studyNoteTitle.focus();

    }
);


cancelStudyNoteButton.addEventListener(
    "click",
    () => {

        studyNoteForm.classList.add(
            "hidden"
        );

        studyNoteTitle.value = "";
        studyNoteContent.value = "";

    }
);


saveStudyNoteButton.addEventListener(
    "click",
    () => {

        const title =
            studyNoteTitle.value.trim();

        const content =
            studyNoteContent.value.trim();


        if (!title || !content) {
            return;
        }


const subjectId =
    currentStudySubjectId;


        const subject =
            subjects.find(
                (item) =>
                    item.id === subjectId
            );


        if (!subject) {
            return;
        }


        if (!Array.isArray(subject.notes)) {
            subject.notes = [];
        }


        subject.notes.push({

            id: Date.now(),

            title: title,

            content: content

        });


        saveSubjects();

        renderStudyNotes(subject);


        studyNoteTitle.value = "";

        studyNoteContent.value = "";

        studyNoteForm.classList.add(
            "hidden"
        );

    }
);

studyNotesSearchInput.addEventListener(
    "input",
    () => {

        const search =
            studyNotesSearchInput.value
                .trim()
                .toLowerCase();

        const subject =
            subjects.find(
                (item) =>
                    item.id ===
                    currentStudySubjectId
            );

        if (!subject) {
            return;
        }

        const filteredNotes =
            subject.notes.filter(
                (note) =>
                    note.title
                        .toLowerCase()
                        .includes(search) ||
                    note.content
                        .toLowerCase()
                        .includes(search)
            );

        renderFilteredStudyNotes(
            filteredNotes
        );

    }
);

const studySubjectModal =
    document.getElementById(
        "study-subject-modal"
    );

const studySubjectModalClose =
    document.getElementById(
        "study-subject-modal-close"
    );

const studyTabs =
    document.querySelectorAll(".study-tab");

const studyTabContents =
    document.querySelectorAll(".study-tab-content");


studyTabs.forEach(
    (tab) => {

        tab.addEventListener(
            "click",
            () => {

                studyTabs.forEach(
                    (button) => {
                        button.classList.remove(
                            "active"
                        );
                    }
                );


                studyTabContents.forEach(
                    (content) => {

                        content.classList.add(
                            "hidden"
                        );

                        content.classList.remove(
                            "active"
                        );

                    }
                );


                tab.classList.add("active");


                const tabName =
                    tab.dataset.studyTab;

                const selectedContent =
                    document.getElementById(
                        `study-tab-${tabName}`
                    );


                if (selectedContent) {

                    selectedContent.classList.remove(
                        "hidden"
                    );

                    selectedContent.classList.add(
                        "active"
                    );

                }

            }
        );

    }
);


studySubjectModalClose.addEventListener(
    "click",
    () => {

        studySubjectModal.classList.add(
            "hidden"
        );

    }
);


studySubjectModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            studySubjectModal
        ) {

            studySubjectModal.classList.add(
                "hidden"
            );

        }

    }
);

// =========================
// ARQUIVOS DE ESTUDOS
// =========================

const addStudyFileButton =
    document.getElementById(
        "add-study-file-button"
    );

const studyFileInput =
    document.getElementById(
        "study-file-input"
    );

const studyFileTitle =
    document.getElementById(
        "study-file-title"
    );


addStudyFileButton.addEventListener(
    "click",
    () => {

        studyFileInput.click();

    }
);


studyFileInput.addEventListener(
    "change",
    async () => {

        const file =
            studyFileInput.files[0];

        const title =
            studyFileTitle.value.trim();


        if (!file) {
            return;
        }


        if (!title) {

            alert(
                "Digite um título para o arquivo."
            );

            studyFileInput.value = "";

            studyFileTitle.focus();

            return;

        }


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "title",
            title
        );


        formData.append(
            "subjectId",
            currentStudySubjectId
        );


        try {

            addStudyFileButton.disabled =
                true;

            addStudyFileButton.textContent =
                "Enviando...";


            const response =
                await fetch(
                    "/api/studies/files",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Erro ao enviar arquivo"
                );

            }


            console.log(
                "Arquivo enviado:",
                result.file
            );


            studyFileTitle.value = "";

            studyFileInput.value = "";


            await loadStudyFiles(
                currentStudySubjectId
            );

            alert(
                "Arquivo enviado com sucesso!"
            );


        } catch (error) {

            console.error(
                "Erro no upload:",
                error
            );


            alert(
                error.message ||
                "Não foi possível enviar o arquivo."
            );

        } finally {

            addStudyFileButton.disabled =
                false;

            addStudyFileButton.textContent =
                "+ Adicionar arquivo";

        }

    }
);

// =========================
// CONTEÚDOS DE ESTUDOS
// =========================

const addStudyTopicButton =
    document.getElementById(
        "add-study-topic-button"
    );

const studyTopicForm =
    document.getElementById(
        "study-topic-form"
    );

const studyTopicTitle =
    document.getElementById(
        "study-topic-title"
    );

const saveStudyTopicButton =
    document.getElementById(
        "save-study-topic"
    );

const cancelStudyTopicButton =
    document.getElementById(
        "cancel-study-topic"
    );

addStudyTopicButton.addEventListener(
    "click",
    () => {

        studyTopicForm.classList.remove(
            "hidden"
        );

        studyTopicTitle.focus();

    }
);


cancelStudyTopicButton.addEventListener(
    "click",
    () => {

        studyTopicForm.classList.add(
            "hidden"
        );

        studyTopicTitle.value = "";

    }
);


saveStudyTopicButton.addEventListener(
    "click",
    () => {

        const title =
            studyTopicTitle.value.trim();

        if (!title) {
            return;
        }


        const subject =
            subjects.find(
                (item) =>
                    item.id ===
                    currentStudySubjectId
            );

        if (!subject) {
            return;
        }


        if (!Array.isArray(subject.topics)) {
            subject.topics = [];
        }


        subject.topics.push({

            id: Date.now(),

            title: title,

            completed: false

        });


        saveSubjects();

        renderStudyTopics(subject);


        studyTopicTitle.value = "";

        studyTopicForm.classList.add(
            "hidden"
        );

    }
);


function renderStudyTopics(subject) {

    if (!Array.isArray(subject.topics)) {
        subject.topics = [];
    }

    const totalTopics =
    subject.topics.length;

const completedTopics =
    subject.topics.filter(
        (topic) => topic.completed
    ).length;

const progress =
    totalTopics === 0
        ? 0
        : Math.round(
            (completedTopics / totalTopics) * 100
        );


const progressPercent =
    document.getElementById(
        "study-progress-percent"
    );

const progressFill =
    document.getElementById(
        "study-progress-fill"
    );

const progressText =
    document.getElementById(
        "study-progress-text"
    );


progressPercent.textContent =
    `${progress}%`;

progressFill.style.width =
    `${progress}%`;

progressText.textContent =
    `${completedTopics} de ${totalTopics} conteúdos concluídos`;


    if (subject.topics.length === 0) {

        topicsContainer.innerHTML = `
            <div class="empty-study-topics">

                <span>
                    ✅
                </span>

                <h3>
                    Nenhum conteúdo ainda
                </h3>

                <p>
                    Adicione conteúdos para acompanhar seu progresso.
                </p>

            </div>
        `;

        return;
    }


    topicsContainer.innerHTML =
        subject.topics.map(
            (topic) => `

                <div
                    class="study-topic-card"
                    data-topic-id="${topic.id}"
                >

                    <label>

                        <input
                            type="checkbox"
                            class="study-topic-checkbox"
                            ${topic.completed ? "checked" : ""}
                        >

                        <span>
                            ${escapeHTML(topic.title)}
                        </span>

                    </label>


                    <button
                        class="study-topic-remove"
                        data-topic-id="${topic.id}"
                    >
                        🗑️
                    </button>

                </div>

            `
        ).join("");


    topicsContainer
        .querySelectorAll(
            ".study-topic-checkbox"
        )
        .forEach(
            (checkbox) => {

                checkbox.addEventListener(
                    "change",
                    () => {

                        const card =
                            checkbox.closest(
                                ".study-topic-card"
                            );

                        const topicId =
                            Number(
                                card.dataset.topicId
                            );

                        const topic =
                            subject.topics.find(
                                (item) =>
                                    item.id ===
                                    topicId
                            );

                        if (!topic) {
                            return;
                        }


                        topic.completed =
                            checkbox.checked;

                        saveSubjects();

                        renderStudyTopics(subject);

                    }
                );

            }
        );


    topicsContainer
        .querySelectorAll(
            ".study-topic-remove"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const topicId =
                            Number(
                                button.dataset.topicId
                            );

                        subject.topics =
                            subject.topics.filter(
                                (topic) =>
                                    topic.id !==
                                    topicId
                            );

                        saveSubjects();

                        renderStudyTopics(
                            subject
                        );

                    }
                );

            }
        );

}

/* =====================================================
   FINANÇAS
===================================================== */

const financeAddButton =
    document.getElementById("finance-add-button");

const financeModal =
    document.getElementById("finance-modal");

const financeModalClose =
    document.getElementById("finance-modal-close");

const financeSaveButton =
    document.getElementById("finance-save-button");

const financeDescription =
    document.getElementById("finance-description");

const financeAmount =
    document.getElementById("finance-amount");

const financeCategory =
    document.getElementById("finance-category");

const financeDate =
    document.getElementById("finance-date");

const financeTransactions =
    document.getElementById("finance-transactions");

const financeCategories =
    document.getElementById("finance-categories");

const financeBalance =
    document.getElementById("finance-balance");

const financeIncome =
    document.getElementById("finance-income");

const financeExpenses =
    document.getElementById("finance-expenses");

const financeResult =
    document.getElementById("finance-result");

const financeTypeButtons =
    document.querySelectorAll(".finance-type-button");

let currentFinanceType = "expense";

let financeData = [];

let editingFinanceId = null;


/* =========================
   ABRIR / FECHAR MODAL
========================= */

financeAddButton.addEventListener(
    "click",
    () => {

        financeModal.classList.remove("hidden");

        financeDescription.focus();

        const today =
            new Date().toISOString().split("T")[0];

        financeDate.value = today;

    }
);


financeModalClose.addEventListener(
    "click",
    closeFinanceModal
);


financeModal.addEventListener(
    "click",
    (event) => {

        if (event.target === financeModal) {
            closeFinanceModal();
        }

    }
);


function closeFinanceModal() {

    financeModal.classList.add("hidden");

    editingFinanceId = null;

    financeDescription.value = "";

    financeAmount.value = "";

    financeCategory.value = "alimentacao";

    financeDate.value = "";

    currentFinanceType = "expense";

    financeTypeButtons.forEach(
        (button) => {

            button.classList.remove("active");

            if (
                button.dataset.financeType ===
                "expense"
            ) {

                button.classList.add("active");

            }

        }
    );

}


/* =========================
   TIPO
========================= */

financeTypeButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                financeTypeButtons.forEach(
                    (item) => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                button.classList.add("active");

                currentFinanceType =
                    button.dataset.financeType;

            }
        );

    }
);


/* =========================
   SALVAR
========================= */

financeSaveButton.addEventListener(
    "click",
    handleFinanceSave
);

async function handleFinanceSave() {

    if (editingFinanceId) {

        await updateFinanceTransaction();

        return;

    }

    await saveFinanceTransaction();

}

async function saveFinanceTransaction() {

    const description =
        financeDescription.value.trim();

    const amount =
        Number(financeAmount.value);

    const category =
        financeCategory.value;

    const transactionDate =
        financeDate.value;


    if (!description) {

        alert(
            "Digite uma descrição."
        );

        financeDescription.focus();

        return;

    }


    if (!amount || amount <= 0) {

        alert(
            "Digite um valor válido."
        );

        financeAmount.focus();

        return;

    }


    if (!transactionDate) {

        alert(
            "Selecione uma data."
        );

        return;

    }


    try {

        financeSaveButton.disabled = true;

        financeSaveButton.textContent =
            "Salvando...";


        const response =
            await fetch(
                "/api/finance",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        type:
                            currentFinanceType,

                        description:
                            description,

                        amount:
                            amount,

                        category:
                            category,

                        transactionDate:
                            transactionDate

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Não foi possível salvar a movimentação"
            );

        }


        closeFinanceModal();

        await loadFinance();

    } catch (error) {

        console.error(
            "Erro ao salvar movimentação:",
            error
        );

        alert(
            error.message ||
            "Não foi possível salvar a movimentação."
        );

    } finally {

        financeSaveButton.disabled = false;

        financeSaveButton.textContent =
            "Salvar movimentação";

    }

}

async function updateFinanceTransaction() {

    const description =
        financeDescription.value.trim();

    const amount =
        Number(financeAmount.value);

    const category =
        financeCategory.value;

    const transactionDate =
        financeDate.value;


    if (!description) {

        alert(
            "Digite uma descrição."
        );

        financeDescription.focus();

        return;

    }


    if (!amount || amount <= 0) {

        alert(
            "Digite um valor válido."
        );

        financeAmount.focus();

        return;

    }


    if (!transactionDate) {

        alert(
            "Selecione uma data."
        );

        return;

    }


    try {

        financeSaveButton.disabled = true;

        financeSaveButton.textContent =
            "Salvando...";


        const response =
            await fetch(
                `/api/finance/${editingFinanceId}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        type:
                            currentFinanceType,

                        description:
                            description,

                        amount:
                            amount,

                        category:
                            category,

                        transactionDate:
                            transactionDate

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Não foi possível atualizar a movimentação"
            );

        }


        closeFinanceModal();

        await loadFinance();

    } catch (error) {

        console.error(
            "Erro ao atualizar movimentação:",
            error
        );

        alert(
            error.message ||
            "Não foi possível atualizar a movimentação."
        );

    } finally {

        financeSaveButton.disabled = false;

        financeSaveButton.textContent =
            "Salvar movimentação";

    }

}


/* =========================
   CARREGAR
========================= */

async function loadFinance() {

    try {

        const response =
            await fetch("/api/finance");


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Não foi possível carregar as finanças"
            );

        }


        financeData =
            result.transactions || [];


        renderFinance();

    } catch (error) {

        console.error(
            "Erro ao carregar finanças:",
            error
        );

        financeTransactions.innerHTML = `
            <div class="finance-empty">

                <h3>
                    Não foi possível carregar
                </h3>

                <p>
                    Tente novamente mais tarde.
                </p>

            </div>
        `;

    }

}


/* =========================
   RENDERIZAR
========================= */

function renderFinance() {

    updateFinanceSummary();

    renderFinanceTransactions();

    renderFinanceCategories();

}


/* =========================
   RESUMO
========================= */

function updateFinanceSummary() {

    let income = 0;

    let expenses = 0;


    financeData.forEach(
        (transaction) => {

            const amount =
                Number(transaction.amount) || 0;


            if (
                transaction.type ===
                "income"
            ) {

                income += amount;

            } else {

                expenses += amount;

            }

        }
    );


    const balance =
        income - expenses;


    financeBalance.textContent =
        formatFinanceCurrency(balance);

    if (dashboardFinanceBalance) {
            dashboardFinanceBalance.textContent =
                formatFinanceCurrency(balance);
        }

    financeIncome.textContent =
        formatFinanceCurrency(income);

    financeExpenses.textContent =
        formatFinanceCurrency(expenses);

    financeResult.textContent =
        formatFinanceCurrency(balance);

}


/* =========================
   MOVIMENTAÇÕES
========================= */

function renderFinanceTransactions() {

    if (financeData.length === 0) {

        financeTransactions.innerHTML = `
            <div class="finance-empty">

                <h3>
                    Nenhuma movimentação
                </h3>

                <p>
                    Adicione sua primeira receita ou despesa.
                </p>

            </div>
        `;

        return;

    }


    financeTransactions.innerHTML =
        financeData.map(
            (transaction) => {

                const isIncome =
                    transaction.type ===
                    "income";


                const sign =
                    isIncome
                        ? "+"
                        : "-";


                const icon =
                    isIncome
                        ? "↗"
                        : "↘";


                const date =
                    formatFinanceDate(
                        transaction.transaction_date
                    );


                return `
                    <div
                        class="finance-transaction"
                    >

                        <div
                            class="finance-transaction-info"
                        >

                            <div
                                class="finance-transaction-icon"
                            >
                                ${icon}
                            </div>

                            <div
                                class="finance-transaction-text"
                            >

                                <strong>
                                    ${escapeHTML(
                                        transaction.description
                                    )}
                                </strong>

                                <span>
                                    ${getFinanceCategoryName(
                                        transaction.category
                                    )}
                                    ·
                                    ${date}
                                </span>

                            </div>

                        </div>

                        <div
                            class="finance-transaction-value ${
                                isIncome
                                    ? "income"
                                    : "expense"
                            }"
                        >
                            ${sign}
                            ${formatFinanceCurrency(
                                transaction.amount
                            )}

                            <button
                                class="finance-edit-button"
                                data-finance-id="${transaction.id}"
                                title="Editar movimentação"
                            >
                                ✎
                            </button>

                            <button
                                class="finance-delete-button"
                                data-finance-id="${transaction.id}"
                                title="Excluir movimentação"
                            >
                                ×
                            </button>

                        </div>

                    </div>
                `;

            }
        ).join("");


    financeTransactions
    .querySelectorAll(
        ".finance-edit-button"
    )
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    editFinanceTransaction(
                        button.dataset.financeId
                    );

                }
            );

        }
    );
    
    financeTransactions
        .querySelectorAll(
            ".finance-delete-button"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteFinanceTransaction(
                            button.dataset.financeId
                        );

                    }
                );

            }
        );

}

/* =========================
   EDITAR
========================= */

function editFinanceTransaction(id) {

    const transaction =
        financeData.find(
            (item) =>
                String(item.id) === String(id)
        );


    if (!transaction) {
        return;
    }


    editingFinanceId =
        transaction.id;


    currentFinanceType =
        transaction.type;


    financeDescription.value =
        transaction.description;


    financeAmount.value =
        transaction.amount;


    financeCategory.value =
        transaction.category;


    financeDate.value =
        transaction.transaction_date;


    financeTypeButtons.forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.financeType ===
                    currentFinanceType
            );

        }
    );


    financeSaveButton.textContent =
        "Salvar alterações";


    financeModal.classList.remove(
        "hidden"
    );

}


/* =========================
   CATEGORIAS
========================= */

function renderFinanceCategories() {

    const expenses =
        financeData.filter(
            (transaction) =>
                transaction.type ===
                "expense"
        );


    if (expenses.length === 0) {

        financeCategories.innerHTML = `
            <div class="finance-empty">

                <h3>
                    Ainda não há dados
                </h3>

                <p>
                    Suas categorias aparecerão aqui.
                </p>

            </div>
        `;

        return;

    }


    const categoryTotals = {};


    expenses.forEach(
        (transaction) => {

            const category =
                transaction.category;

            const amount =
                Number(transaction.amount) || 0;


            categoryTotals[category] =
                (categoryTotals[category] || 0) +
                amount;

        }
    );


    const totalExpenses =
        expenses.reduce(
            (total, transaction) =>
                total +
                (Number(transaction.amount) || 0),
            0
        );


    const categories =
        Object.entries(categoryTotals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    financeCategories.innerHTML =
        categories.map(
            ([category, amount]) => {

                const percentage =
                    totalExpenses > 0
                        ? (
                            amount /
                            totalExpenses
                        ) * 100
                        : 0;


                return `
                    <div
                        class="finance-category"
                    >

                        <div
                            class="finance-category-header"
                        >

                            <span>
                                ${getFinanceCategoryName(
                                    category
                                )}
                            </span>

                            <strong>
                                ${formatFinanceCurrency(
                                    amount
                                )}
                            </strong>

                        </div>

                        <div
                            class="finance-category-bar"
                        >

                            <div
                                class="finance-category-fill"
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* =========================
   EXCLUIR
========================= */

async function deleteFinanceTransaction(id) {

    const confirmed =
        confirm(
            "Excluir esta movimentação?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/finance/${id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Não foi possível remover a movimentação"
            );

        }


        await loadFinance();

    } catch (error) {

        console.error(
            "Erro ao excluir movimentação:",
            error
        );

        alert(
            error.message ||
            "Não foi possível excluir a movimentação."
        );

    }

}


/* =========================
   UTILITÁRIOS
========================= */

function formatFinanceCurrency(value) {

    return Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function formatFinanceDate(date) {

    if (!date) {
        return "Sem data";
    }


    return new Date(
        `${date}T12:00:00`
    ).toLocaleDateString(
        "pt-BR"
    );

}


function getFinanceCategoryName(category) {

    const names = {

        alimentacao:
            "Alimentação",

        transporte:
            "Transporte",

        casa:
            "Casa",

        lazer:
            "Lazer",

        estudos:
            "Estudos",

        saude:
            "Saúde",

        outros:
            "Outros"

    };


    return names[category] ||
        category;

}


/* =========================
   INICIALIZAR FINANÇAS
========================= */

loadFinance();

// =========================
// ANIMES — PESQUISA
// =========================

const animeSearchInput =
    document.getElementById("anime-search-input");

const animeSearchButton =
    document.getElementById("anime-search-button");

const animeContainer =
    document.getElementById("anime-container");


let animeSearchResults = [];


async function searchAnime() {

    const query =
        animeSearchInput.value.trim();

    if (!query) {
        animeContainer.innerHTML = "";
        return;
    }

    animeContainer.innerHTML = `
        <p>
            Pesquisando...
        </p>
    `;

    try {

        /*
         * IMPORTANTE:
         * NÃO alterar esta rota.
         *
         * Ela é a mesma utilizada
         * pela pesquisa normal de séries.
         */
        const response =
            await fetch(
                `/api/tmdb/series/search?query=${encodeURIComponent(query)}`
            );

        if (!response.ok) {
            throw new Error(
                "Erro ao pesquisar animes"
            );
        }

        const result =
            await response.json();

        const results =
            result.data?.results || [];

        /*
         * O TMDB não possui uma categoria
         * exclusiva para anime.
         *
         * Por isso filtramos as séries japonesas
         * ou marcadas como animação.
         */
        animeSearchResults =
            results.filter(
                (item) =>
                    item.origin_country?.includes("JP") ||
                    item.genre_ids?.includes(16)
            );

        renderAnimeSearchResults();

    } catch (error) {

        console.error(
            "Erro ao pesquisar animes:",
            error
        );

        animeContainer.innerHTML = `
            <p>
                Não foi possível pesquisar animes.
            </p>
        `;
    }
}


function renderAnimeSearchResults() {

    if (animeSearchResults.length === 0) {

        animeContainer.innerHTML = `
            <p>
                Nenhum anime encontrado.
            </p>
        `;

        return;
    }


    animeContainer.innerHTML =
        animeSearchResults
            .map(
                (anime) => {

                    const poster =
                        anime.poster_path
                            ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
                            : "https://via.placeholder.com/500x750?text=Sem+imagem";


                    const year =
                        anime.first_air_date
                            ? anime.first_air_date.slice(0, 4)
                            : "Ano desconhecido";


                    const rating =
                        Number(
                            anime.vote_average
                        ) || 0;


                    return `
                        <div
                            class="anime-card"
                            data-anime-id="${anime.id}"
                        >

                            <img
                                src="${poster}"
                                alt="${anime.name}"
                            >

                            <div
                                class="anime-card-info"
                            >

                                <h3>
                                    ${anime.name}
                                </h3>

                                <p>
                                    ${year}
                                </p>

                                <span>
                                    ⭐ ${rating.toFixed(1)}
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");


    animeContainer
        .querySelectorAll(".anime-card")
        .forEach(
            (card) => {

                card.addEventListener(
                    "click",
                    () => {

                        const animeId =
                            card.dataset.animeId;

                        openAnimeDetails(
                            animeId
                        );

                    }
                );

            }
        );
}


animeSearchButton.addEventListener(
    "click",
    searchAnime
);


animeSearchInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            searchAnime();
        }

    }
);

// =========================
// DETALHES DO ANIME
// =========================

const animeModal =
    document.getElementById("anime-modal");

const animeModalBody =
    document.getElementById("anime-modal-body");

const animeModalClose =
    document.getElementById("anime-modal-close");


function closeAnimeModal() {

    animeModal.classList.add("hidden");

}


// =========================
// ABRIR DETALHES
// =========================

async function openAnimeDetails(animeId) {

    animeModalBody.innerHTML = `
        <p>Carregando detalhes...</p>
    `;

    animeModal.classList.remove("hidden");


    try {

        const response =
            await fetch(
                `/api/tmdb/series/${animeId}`
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível carregar os detalhes."
            );

        }


        const result =
            await response.json();


        renderAnimeDetails(
            result.data
        );

        await addAnimeEpisodeProgress(
            result.data,
            result.data
        );


    } catch (error) {

        console.error(
            "Erro ao carregar detalhes do anime:",
            error
        );


        animeModalBody.innerHTML = `
            <div class="empty-movie-library">

                <h3>
                    Não foi possível carregar
                </h3>

                <p>
                    Tente novamente mais tarde.
                </p>

            </div>
        `;

    }

}


// =========================
// RENDERIZAR DETALHES
// =========================

function renderAnimeDetails(anime) {

    const year =
        anime.first_air_date
            ? anime.first_air_date.substring(0, 4)
            : "—";


    const genres =
        (anime.genres || [])
            .map(
                genre => genre.name
            )
            .join(", ");


    const savedAnime =
        animeLibraryCache.find(
            item =>
                Number(item.id) ===
                Number(anime.id)
        );


    const favorite =
        savedAnime
            ? savedAnime.favorite
            : false;


    const status =
        savedAnime
            ? savedAnime.status
            : "want";


    animeModalBody.innerHTML = `

        <div class="anime-details">

            <div class="anime-details-poster">

                ${
                    anime.poster_path
                        ? `
                            <img
                                src="https://image.tmdb.org/t/p/w500${anime.poster_path}"
                                alt="${anime.name}"
                            >
                        `
                        : `
                            <div class="anime-no-poster">
                                Sem imagem
                            </div>
                        `
                }

            </div>


            <div class="anime-details-info">

                <h2>
                    ${anime.name}
                </h2>


                <div class="anime-details-meta">

                    <span>
                        ${year}
                    </span>

                    <span>
                        ⭐ ${Number(anime.vote_average || 0).toFixed(1)}
                    </span>

                    ${
                        genres
                            ? `
                                <span>
                                    ${genres}
                                </span>
                            `
                            : ""
                    }

                </div>


                <p class="anime-details-overview">

                    ${
                        anime.overview ||
                        "Nenhuma descrição disponível."
                    }

                </p>


                <div class="anime-actions">

                    <button
                        class="anime-favorite-button"
                        id="anime-favorite-button"
                    >
                        ${
                            favorite
                                ? "❤️ Favoritado"
                                : "♡ Favoritar"
                        }
                    </button>


                    <select
                        id="anime-status"
                    >

                        <option
                            value="want"
                            ${status === "want" ? "selected" : ""}
                        >
                            Quero assistir
                        </option>

                        <option
                            value="watching"
                            ${status === "watching" ? "selected" : ""}
                        >
                            Assistindo
                        </option>

                        <option
                            value="completed"
                            ${status === "completed" ? "selected" : ""}
                        >
                            Concluído
                        </option>

                    </select>


                    ${
                        savedAnime
                            ? `
                                <button
                                    class="anime-remove-button"
                                    id="anime-remove-button"
                                >
                                    🗑 Remover
                                </button>
                            `
                            : ""
                    }

                </div>

            </div>

        </div>

    `;


    // =========================
    // FAVORITO
    // =========================

    const favoriteButton =
        document.getElementById(
            "anime-favorite-button"
        );


    favoriteButton.addEventListener(
        "click",
        async () => {

            const current =
                getSavedAnime(anime.id);


            const newFavorite =
                current
                    ? !current.favorite
                    : true;


            await saveAnime(
                anime,
                current
                    ? current.status
                    : "want",
                newFavorite
            );


            favoriteButton.textContent =
                newFavorite
                    ? "❤️ Favoritado"
                    : "♡ Favoritar";

        }
    );


    // =========================
    // STATUS
    // =========================

    const statusSelect =
        document.getElementById(
            "anime-status"
        );


    statusSelect.addEventListener(
    "change",
    async () => {

        const newStatus =
            statusSelect.value;

        try {

            const response =
                await fetch(
                    `/api/media/anime/${Number(anime.id)}/status`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify({
                            status: newStatus
                        })
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível atualizar o status."
                );
            }

            const current =
                getSavedAnime(anime.id);

            if (current) {
                current.status =
                    newStatus;
            }

            renderAnimeLibrary();

        } catch (error) {

            console.error(
                "Erro ao atualizar status do anime:",
                error
            );

            alert(
                "Não foi possível atualizar o status."
            );

        }

    }
);


    // =========================
    // REMOVER
    // =========================

    const removeButton =
        document.getElementById(
            "anime-remove-button"
        );


    if (removeButton) {

        removeButton.addEventListener(
            "click",
            async () => {

                await removeAnime(
                    anime.id
                );

                closeAnimeModal();

            }
        );

    }

}


// =========================
// FECHAR MODAL
// =========================

if (animeModalClose) {

    animeModalClose.addEventListener(
        "click",
        closeAnimeModal
    );

}


if (animeModal) {

    animeModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                animeModal
            ) {

                closeAnimeModal();

            }

        }
    );

}

// =========================
// BIBLIOTECA DE ANIMES
// =========================

const animeLibraryContainer =
    document.getElementById("anime-library-container");

const animeLibraryFilters =
    document.querySelectorAll(
        "[data-anime-library-filter]"
    );

let currentAnimeLibraryFilter = "all";

let animeLibraryCache = [];


// =========================
// CARREGAR BIBLIOTECA
// =========================

async function loadAnimeLibrary() {

    try {

        const response =
            await fetch(
                "/api/media/anime"
            );


        if (!response.ok) {
            throw new Error(
                "Não foi possível carregar a biblioteca."
            );
        }


        const result =
            await response.json();


        animeLibraryCache =
            (result.media || []).map(
                anime => ({

                    id: Number(anime.tmdb_id),

                    name: anime.title,

                    poster_path:
                        anime.poster_path,

                    first_air_date:
                        anime.release_date,

                    vote_average:
                        Number(
                            anime.vote_average
                        ) || 0,

                    status:
                        anime.status || "want",

                    favorite:
                        Boolean(
                            anime.favorite
                        ),

                    season_number:
                        anime.season_number
                            ? Number(
                                anime.season_number
                            )
                            : null,

                    episode_number:
                        anime.episode_number
                            ? Number(
                                anime.episode_number
                            )
                            : null

                })
            );


        renderAnimeLibrary();

        updateDashboardEntertainment();


    } catch (error) {

        console.error(
            "Erro ao carregar biblioteca de animes:",
            error
        );


        animeLibraryContainer.innerHTML = `

            <div class="empty-movie-library">

                <h3>
                    Não foi possível carregar
                </h3>

                <p>
                    Tente novamente mais tarde.
                </p>

            </div>

        `;

    }

}


// =========================
// RENDERIZAR BIBLIOTECA
// =========================

function renderAnimeLibrary() {

    if (!animeLibraryContainer) {
        return;
    }


    let animes =
        [...animeLibraryCache];


    // FILTRO

    if (
        currentAnimeLibraryFilter ===
        "favorite"
    ) {

        animes =
            animes.filter(
                anime =>
                    anime.favorite
            );

    }


    if (
        currentAnimeLibraryFilter !==
            "all" &&
        currentAnimeLibraryFilter !==
            "favorite"
    ) {

        animes =
            animes.filter(
                anime =>
                    anime.status ===
                    currentAnimeLibraryFilter
            );

    }


    // VAZIO

    if (!animes.length) {

        animeLibraryContainer.innerHTML = `

            <div class="empty-movie-library">

                <h3>
                    Nenhum anime encontrado
                </h3>

                <p>
                    Sua biblioteca ainda está vazia.
                </p>

            </div>

        `;

        return;

    }


    // CARDS

    animeLibraryContainer.innerHTML =
        animes.map(
            anime => {

                const year =
                    anime.first_air_date
                        ? anime.first_air_date.substring(
                            0,
                            4
                        )
                        : "—";


                const progress =
                    anime.season_number &&
                    anime.episode_number
                        ? `
                            <div class="anime-progress">
                                T${anime.season_number}
                                • E${anime.episode_number}
                            </div>
                        `
                        : "";


                return `

                    <div
                        class="anime-card"
                        data-anime-id="${anime.id}"
                    >

                        ${
                            anime.poster_path
                                ? `
                                    <img
                                        src="https://image.tmdb.org/t/p/w500${anime.poster_path}"
                                        alt="${anime.name}"
                                    >
                                `
                                : `
                                    <div class="anime-no-poster">
                                        Sem imagem
                                    </div>
                                `
                        }


                        <div class="anime-card-info">

                            <h3>
                                ${anime.name}
                            </h3>

                            <p>
                                ${year}
                            </p>

                            <span>
                                ⭐ ${anime.vote_average.toFixed(1)}
                            </span>

                            ${
                                anime.favorite
                                    ? `<span>❤️</span>`
                                    : ""
                            }

                            ${progress}

                        </div>

                    </div>

                `;

            }
        ).join("");


    // CLIQUE NOS CARDS

    animeLibraryContainer
        .querySelectorAll(".anime-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    openAnimeDetails(
                        card.dataset.animeId
                    );

                }
            );

        });

}


// =========================
// FILTROS
// =========================

animeLibraryFilters.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                animeLibraryFilters
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                currentAnimeLibraryFilter =
                    button.dataset
                        .animeLibraryFilter;


                renderAnimeLibrary();

            }
        );

    }
);


// =========================
// PEGAR ANIME SALVO
// =========================

function getSavedAnime(animeId) {

    return animeLibraryCache.find(
        anime =>
            Number(anime.id) ===
            Number(animeId)
    );

}


// =========================
// SALVAR ANIME
// =========================

async function saveAnime(
    anime,
    status = "want",
    favorite = false,
    seasonNumber = null,
    episodeNumber = null
) {

    const existingAnime =
        getSavedAnime(
            anime.id
        );


    // Preserva progresso existente

    if (
        seasonNumber === null &&
        existingAnime
    ) {

        seasonNumber =
            existingAnime.season_number;

    }


    if (
        episodeNumber === null &&
        existingAnime
    ) {

        episodeNumber =
            existingAnime.episode_number;

    }


    try {

        const response =
            await fetch(
                "/api/media",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            type: "anime",

                            tmdbId:
                                Number(
                                    anime.id
                                ),

                            title:
                                anime.name,

                            posterPath:
                                anime.poster_path ||
                                null,

                            releaseDate:
                                anime.first_air_date ||
                                null,

                            voteAverage:
                                Number(
                                    anime.vote_average
                                ) || 0,

                            status,

                            favorite,

                            seasonNumber,

                            episodeNumber

                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível salvar o anime."
            );

        }


        // Atualiza biblioteca

        await loadAnimeLibrary();


    } catch (error) {

        console.error(
            "Erro ao salvar anime:",
            error
        );


        alert(
            "Não foi possível salvar o anime."
        );

    }

}


// =========================
// REMOVER ANIME
// =========================

async function removeAnime(animeId) {

    const confirmed =
        confirm(
            "Remover este anime da biblioteca?"
        );


    if (!confirmed) {
        return;
    }


    const previousCache =
        [...animeLibraryCache];


    animeLibraryCache =
        animeLibraryCache.filter(
            anime =>
                Number(anime.id) !==
                Number(animeId)
        );


    renderAnimeLibrary();


    try {

        const response =
            await fetch(
                `/api/media/anime/${Number(animeId)}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível remover o anime."
            );

        }


    } catch (error) {

        console.error(
            "Erro ao remover anime:",
            error
        );


        animeLibraryCache =
            previousCache;


        renderAnimeLibrary();


        alert(
            "Não foi possível remover o anime."
        );

    }

}


// =========================
// INICIALIZAR BIBLIOTECA
// =========================

loadAnimeLibrary();

// ============================================================
// PROGRESSO — TEMPORADA E EPISÓDIO
// ============================================================

function createEpisodeProgress(media, type, details, saved) {
    const seasons = (details?.seasons || []).filter(
        (season) => season.season_number > 0
    );

    if (!seasons.length) {
        return "";
    }

    const savedSeason = Number(saved?.season_number) || 1;
    const savedEpisode = Number(saved?.episode_number) || 1;

    const selectedSeason =
        seasons.find(
            (season) => season.season_number === savedSeason
        ) || seasons[0];

    const maxEpisodes =
        Number(selectedSeason?.episode_count) || 1;

    const safeEpisode = Math.min(
        Math.max(savedEpisode, 1),
        maxEpisodes
    );

    return `
        <div class="media-progress" data-progress-type="${type}" data-progress-id="${media.id}">

            <div class="media-progress-title">
                Progresso
            </div>

            <div class="media-progress-controls">

                <div class="media-progress-field">
                    <label>Temporada</label>

                    <select class="media-season-select">
                        ${seasons
                            .map(
                                (season) => `
                                    <option
                                        value="${season.season_number}"
                                        ${season.season_number === selectedSeason.season_number ? "selected" : ""}
                                    >
                                        ${season.season_number}
                                    </option>
                                `
                            )
                            .join("")}
                    </select>
                </div>

                <div class="media-progress-field">
                    <label>Episódio</label>

                    <div class="media-episode-control">
                        <button
                            type="button"
                            class="media-episode-minus"
                        >
                            −
                        </button>

                        <input
                            type="number"
                            class="media-episode-input"
                            min="1"
                            max="${maxEpisodes}"
                            value="${safeEpisode}"
                        />

                        <button
                            type="button"
                            class="media-episode-plus"
                        >
                            +
                        </button>
                    </div>
                </div>

            </div>

            <div class="media-progress-limit">
                ${maxEpisodes} episódios nesta temporada
            </div>

            <button
                type="button"
                class="media-progress-save"
            >
                Salvar progresso
            </button>

        </div>
    `;
}


function setupEpisodeProgress(container, media, type, details) {
    if (!container) return;

    const progress = container.querySelector(".media-progress");

    if (!progress) return;

    const seasonSelect =
        progress.querySelector(".media-season-select");

    const episodeInput =
        progress.querySelector(".media-episode-input");

    const minusButton =
        progress.querySelector(".media-episode-minus");

    const plusButton =
        progress.querySelector(".media-episode-plus");

    const saveButton =
        progress.querySelector(".media-progress-save");

    function getSeasonDetails() {
        const seasonNumber =
            Number(seasonSelect.value);

        return (
            details?.seasons?.find(
                (season) =>
                    Number(season.season_number) ===
                    seasonNumber
            ) || null
        );
    }

    function updateEpisodeLimit() {
        const season = getSeasonDetails();

        const maxEpisodes =
            Number(season?.episode_count) || 1;

        episodeInput.max = maxEpisodes;

        let episode =
            Number(episodeInput.value) || 1;

        if (episode < 1) episode = 1;

        if (episode > maxEpisodes) {
            episode = maxEpisodes;
        }

        episodeInput.value = episode;

        const limit =
            progress.querySelector(
                ".media-progress-limit"
            );

        if (limit) {
            limit.textContent =
                `${maxEpisodes} episódios nesta temporada`;
        }
    }

    seasonSelect.addEventListener(
        "change",
        () => {
            episodeInput.value = 1;
            updateEpisodeLimit();
        }
    );

    minusButton.addEventListener(
        "click",
        () => {
            let episode =
                Number(episodeInput.value) || 1;

            episode = Math.max(
                1,
                episode - 1
            );

            episodeInput.value = episode;
        }
    );

    plusButton.addEventListener(
        "click",
        () => {
            const season =
                getSeasonDetails();

            const maxEpisodes =
                Number(season?.episode_count) || 1;

            let episode =
                Number(episodeInput.value) || 1;

            episode = Math.min(
                maxEpisodes,
                episode + 1
            );

            episodeInput.value = episode;
        }
    );

    episodeInput.addEventListener(
        "change",
        () => {
            updateEpisodeLimit();
        }
    );

    saveButton.addEventListener(
        "click",
        async () => {

            const seasonNumber =
                Number(seasonSelect.value);

            const season =
                getSeasonDetails();

            const maxEpisodes =
                Number(season?.episode_count) || 1;

            let episodeNumber =
                Number(episodeInput.value) || 1;

            episodeNumber = Math.min(
                Math.max(episodeNumber, 1),
                maxEpisodes
            );

            episodeInput.value =
                episodeNumber;

            saveButton.disabled = true;
            saveButton.textContent =
                "Salvando...";

            try {

                const existing =
                    type === "anime"
                        ? getSavedAnime(media.id)
                        : getSavedSeries(media.id);

                if (type === "anime") {

                    await saveAnime(
                        media,
                        existing?.status || "want",
                        Boolean(existing?.favorite),
                        seasonNumber,
                        episodeNumber
                    );

                } else {

                    await saveSeries(
                        media,
                        existing?.status || "want",
                        Boolean(existing?.favorite),
                        seasonNumber,
                        episodeNumber
                    );
                }

                saveButton.textContent =
                    "Salvo ✓";

                if (type === "anime") {
                    await loadAnimeLibrary();
                } else {
                    await loadSeriesLibrary();
                }

                setTimeout(() => {
                    saveButton.textContent =
                        "Salvar progresso";
                    saveButton.disabled = false;
                }, 1200);

            } catch (error) {

                console.error(
                    "Erro ao salvar progresso:",
                    error
                );

                saveButton.textContent =
                    "Erro ao salvar";

                saveButton.disabled = false;
            }
        }
    );

    updateEpisodeLimit();
}


// ============================================================
// CARREGAR PROGRESSO NO MODAL DE SÉRIES
// ============================================================

async function addSeriesEpisodeProgress(
    series,
    details
) {
    const saved =
        getSavedSeries(series.id);

    if (!saved) return;

    const container =
        document.getElementById(
            "series-modal-body"
        );

    if (!container) return;

    if (
        container.querySelector(
            ".media-progress"
        )
    ) {
        return;
    }

    const progressHTML =
        createEpisodeProgress(
            series,
            "series",
            details,
            saved
        );

    const actions =
        container.querySelector(
            ".series-actions"
        );

    if (actions) {
        actions.insertAdjacentHTML(
            "afterend",
            progressHTML
        );
    } else {
        container.insertAdjacentHTML(
            "beforeend",
            progressHTML
        );
    }

    setupEpisodeProgress(
        container,
        series,
        "series",
        details
    );
}


// ============================================================
// CARREGAR PROGRESSO NO MODAL DE ANIMES
// ============================================================

async function addAnimeEpisodeProgress(
    anime,
    details
) {
    const saved =
        getSavedAnime(anime.id);

    if (!saved) return;

    const container =
        document.getElementById(
            "anime-modal-body"
        );

    if (!container) return;

    if (
        container.querySelector(
            ".media-progress"
        )
    ) {
        return;
    }

    const progressHTML =
        createEpisodeProgress(
            anime,
            "anime",
            details,
            saved
        );

    const actions =
        container.querySelector(
            ".anime-actions"
        );

    if (actions) {
        actions.insertAdjacentHTML(
            "afterend",
            progressHTML
        );
    } else {
        container.insertAdjacentHTML(
            "beforeend",
            progressHTML
        );
    }

    setupEpisodeProgress(
        container,
        anime,
        "anime",
        details
    );
}

/* =====================================================
   ORBIT 2.0 — NOTIFICAÇÕES / PREFERÊNCIAS / UX
===================================================== */

const orbitNotificationButton = document.getElementById("top-notifications-button");
const orbitNotificationPanel = document.getElementById("orbit-notifications-panel");
const orbitNotificationClose = document.getElementById("orbit-notifications-close");
const orbitNotificationList = document.getElementById("orbit-notifications-list");
const orbitNotificationBadge = document.getElementById("notification-badge");
const orbitNotificationSettingsButton = document.getElementById("orbit-notifications-settings");
const settingsNotificationsToggle = document.getElementById("settings-notifications-toggle");
const settingsNotificationsPermission = document.getElementById("settings-notifications-permission");
const settingsNotificationsStatus = document.getElementById("settings-notifications-status");

function getUpcomingOrbitNotifications() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return events
        .filter((event) => {
            if (!event?.date || !event?.title) return false;
            const date = new Date(`${event.date}T${event.start || "00:00"}:00`);
            return eventOccursOnDate(event, date) && date >= start && date < end;
        })
        .map((event) => ({
            ...event,
            _date: new Date(`${event.date}T${event.start || "00:00"}:00`)
        }))
        .sort((a, b) => a._date - b._date)
        .slice(0, 5);
}

function formatNotificationDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const prefix = dateOnly.getTime() === today.getTime()
        ? "Hoje"
        : dateOnly.getTime() === tomorrow.getTime()
            ? "Amanhã"
            : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    return `${prefix}${eventHasTime(date) ? ` • ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}`;
}

function eventHasTime(date) {
    return date.getHours() !== 0 || date.getMinutes() !== 0;
}

function renderOrbitNotifications() {
    if (!orbitNotificationList) return;

    const upcoming = getUpcomingOrbitNotifications();
    if (orbitNotificationBadge) {
        orbitNotificationBadge.textContent = String(upcoming.length);
        orbitNotificationBadge.classList.toggle("hidden", upcoming.length === 0);
    }

    if (!upcoming.length) {
        orbitNotificationList.innerHTML = `
            <div class="orbit-notification-empty">
                <span>✓</span>
                <div><strong>Tudo em dia</strong><p>Nenhum compromisso nos próximos dias.</p></div>
            </div>`;
        return;
    }

    orbitNotificationList.innerHTML = upcoming.map((event) => `
        <button type="button" class="orbit-notification-item" data-notification-event-id="${String(event.id)}">
            <span class="orbit-notification-dot"></span>
            <span class="orbit-notification-content">
                <strong>${escapeHTML(event.title)}</strong>
                <small>${formatNotificationDate(event._date)}</small>
            </span>
        </button>
    `).join("");

    orbitNotificationList.querySelectorAll("[data-notification-event-id]").forEach((item) => {
        item.addEventListener("click", () => {
            closeOrbitNotifications();
            navigateToPage("agenda");
        });
    });
}

function openOrbitNotifications() {
    renderOrbitNotifications();
    orbitNotificationPanel?.classList.remove("hidden");
    orbitNotificationPanel?.setAttribute("aria-hidden", "false");
    orbitNotificationButton?.setAttribute("aria-expanded", "true");
}

function closeOrbitNotifications() {
    orbitNotificationPanel?.classList.add("hidden");
    orbitNotificationPanel?.setAttribute("aria-hidden", "true");
    orbitNotificationButton?.setAttribute("aria-expanded", "false");
}

function refreshNotificationSettingsUI() {
    const enabled = getNotificationSettings().enabled;
    if (settingsNotificationsToggle) settingsNotificationsToggle.checked = enabled;

    if (settingsNotificationsPermission) {
        settingsNotificationsPermission.disabled = !browserNotificationsSupported();
        settingsNotificationsPermission.textContent = !browserNotificationsSupported()
            ? "Não suportado neste navegador"
            : Notification.permission === "granted"
                ? "Notificações permitidas"
                : "Permitir notificações";
    }

    if (settingsNotificationsStatus) {
        if (!browserNotificationsSupported()) {
            settingsNotificationsStatus.textContent = "Seu navegador não oferece notificações.";
        } else if (Notification.permission === "denied") {
            settingsNotificationsStatus.textContent = "Bloqueadas pelo navegador. Altere a permissão nas configurações do site.";
        } else if (enabled) {
            settingsNotificationsStatus.textContent = "Lembretes ativados.";
        } else {
            settingsNotificationsStatus.textContent = "Lembretes desativados.";
        }
    }
}

orbitNotificationButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (orbitNotificationPanel?.classList.contains("hidden")) openOrbitNotifications();
    else closeOrbitNotifications();
});

orbitNotificationClose?.addEventListener("click", closeOrbitNotifications);

orbitNotificationSettingsButton?.addEventListener("click", () => {
    closeOrbitNotifications();
    navigateToPage("settings");
});

document.addEventListener("click", (event) => {
    if (!orbitNotificationPanel || orbitNotificationPanel.classList.contains("hidden")) return;
    if (!orbitNotificationPanel.contains(event.target) && !orbitNotificationButton?.contains(event.target)) {
        closeOrbitNotifications();
    }
});

settingsNotificationsToggle?.addEventListener("change", async () => {
    const enabled = settingsNotificationsToggle.checked;

    if (enabled) {
        const permission = await requestNotificationPermission();
        if (permission !== "granted") {
            settingsNotificationsToggle.checked = false;
            setNotificationSettings({ enabled: false });
            refreshNotificationSettingsUI();
            return;
        }
    }

    setNotificationSettings({ enabled });
    refreshNotificationSettingsUI();
    renderOrbitNotifications();

    if (enabled) {
        events.forEach((event) => scheduleReminder(event));
    }
});

settingsNotificationsPermission?.addEventListener("click", async () => {
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
        setNotificationSettings({ enabled: true });
        if (settingsNotificationsToggle) settingsNotificationsToggle.checked = true;
        events.forEach((event) => scheduleReminder(event));
    }
    refreshNotificationSettingsUI();
});

window.addEventListener("orbit:auth-changed", () => {
    refreshNotificationSettingsUI();
    renderOrbitNotifications();
});

window.addEventListener("orbit:events-updated", () => {
    renderOrbitNotifications();
});

refreshNotificationSettingsUI();
renderOrbitNotifications();

/* =====================================================
   ORBIT — CONFIGURAÇÕES 2.0 / CONTROLES
===================================================== */

const ORBIT_SETTINGS_DEFAULTS = {
    accent: "purple",
    reducedMotion: false,
    notificationBadge: true,
    defaultPage: "dashboard",
    rememberPage: false,
    avatarColor: "purple"
};

const ORBIT_ACCENTS = {
    purple: { accent: "#8b5cf6", hover: "#7c3aed" },
    blue: { accent: "#3b82f6", hover: "#2563eb" },
    pink: { accent: "#ec4899", hover: "#db2777" },
    green: { accent: "#22c55e", hover: "#16a34a" },
    orange: { accent: "#f97316", hover: "#ea580c" }
};

function getOrbitSettingsKey() {
    return window.orbitUserId ? `orbitSettings:${window.orbitUserId}` : null;
}

function getOrbitSettings() {
    const key = getOrbitSettingsKey();
    if (!key) return { ...ORBIT_SETTINGS_DEFAULTS };

    try {
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        return { ...ORBIT_SETTINGS_DEFAULTS, ...saved };
    } catch {
        return { ...ORBIT_SETTINGS_DEFAULTS };
    }
}

function saveOrbitSettings(settings) {
    const key = getOrbitSettingsKey();
    if (!key) return;

    localStorage.setItem(key, JSON.stringify({
        ...ORBIT_SETTINGS_DEFAULTS,
        ...settings
    }));
}

function updateOrbitSettings(patch) {
    const settings = getOrbitSettings();
    const next = { ...settings, ...patch };
    saveOrbitSettings(next);
    return next;
}

function applyOrbitAccent(accentName) {
    const accent = ORBIT_ACCENTS[accentName] || ORBIT_ACCENTS.purple;
    document.documentElement.style.setProperty("--accent", accent.accent);
    document.documentElement.style.setProperty("--accent-hover", accent.hover);

    document.querySelectorAll(".settings-theme-option").forEach((button) => {
        button.classList.toggle("active", button.dataset.accent === accentName);
    });
}

function applyOrbitAvatarColor(colorName) {
    const colors = {
        purple: ["rgba(139, 92, 246, 0.14)", "#c4b5fd"],
        blue: ["rgba(59, 130, 246, 0.14)", "#93c5fd"],
        pink: ["rgba(236, 72, 153, 0.14)", "#f9a8d4"],
        green: ["rgba(34, 197, 94, 0.14)", "#86efac"],
        orange: ["rgba(249, 115, 22, 0.14)", "#fdba74"]
    };
    const [background, foreground] = colors[colorName] || colors.purple;
    const avatar = document.getElementById("settings-avatar");
    if (avatar) {
        avatar.style.background = background;
        avatar.style.color = foreground;
    }

    document.querySelectorAll(".settings-avatar-swatch").forEach((button) => {
        button.classList.toggle("active", button.dataset.avatarColor === colorName);
    });
}

function applyOrbitSettings() {
    const settings = getOrbitSettings();

    applyOrbitAccent(settings.accent);
    applyOrbitAvatarColor(settings.avatarColor);

    document.body.classList.toggle("orbit-reduced-motion", settings.reducedMotion === true);

    const reducedMotion = document.getElementById("settings-reduced-motion");
    if (reducedMotion) reducedMotion.checked = settings.reducedMotion === true;

    const badgeToggle = document.getElementById("settings-notification-badge-toggle");
    if (badgeToggle) badgeToggle.checked = settings.notificationBadge !== false;

    const defaultPage = document.getElementById("settings-default-page");
    if (defaultPage) defaultPage.value = settings.defaultPage || "dashboard";

    const rememberPage = document.getElementById("settings-remember-page");
    if (rememberPage) rememberPage.checked = settings.rememberPage === true;

    updateOrbitNotificationBadgeVisibility();
}

function updateOrbitNotificationBadgeVisibility() {
    const badge = document.getElementById("notification-badge");
    if (!badge) return;
    badge.classList.toggle("settings-badge-hidden", getOrbitSettings().notificationBadge === false);
}

window.orbitRememberPage = function (pageId) {
    if (!pageId || !window.orbitUserId) return;
    const settings = getOrbitSettings();
    if (!settings.rememberPage) return;
    saveOrbitSettings({ ...settings, lastPage: pageId });
};

function navigateToSavedOrbitPage() {
    if (!window.orbitUserId) return;
    const settings = getOrbitSettings();
    const target = settings.rememberPage && settings.lastPage
        ? settings.lastPage
        : settings.defaultPage || "dashboard";
    const allowed = ["dashboard", "tasks", "agenda", "projects", "studies", "finance", "animes", "movies", "series", "games", "settings"];
    navigateToPage(allowed.includes(target) ? target : "dashboard");
}

function setSettingsStatus(id, message, type = "") {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.className = `settings-status ${type}`.trim();
}

async function exportOrbitData() {
    const button = document.getElementById("settings-export-data");
    if (!window.orbitUserId) {
        setSettingsStatus("settings-data-status", "Faça login para exportar seus dados.", "error");
        return;
    }

    button && (button.disabled = true);
    setSettingsStatus("settings-data-status", "Preparando exportação...");

    try {
        const endpoints = [
            ["tasks", "/api/tasks"],
            ["agenda_events", "/api/events"],
            ["projects", "/api/projects"],
            ["project_tasks", "/api/project-tasks"],
            ["finance_transactions", "/api/finance"],
            ["movies", "/api/media/movie"],
            ["series", "/api/media/series"],
            ["animes", "/api/media/anime"],
            ["steam_id", "/api/user/steam-id"]
        ];

        const results = await Promise.allSettled(
            endpoints.map(async ([name, url]) => {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
                return [name, await response.json()];
            })
        );

        const remote = {};
        const unavailable = [];
        results.forEach((result, index) => {
            const [name] = endpoints[index];
            if (result.status === "fulfilled") remote[name] = result.value[1];
            else unavailable.push(name);
        });

        const local = {};
        const userId = window.orbitUserId;
        const localKeys = [
            `orbitSettings:${userId}`,
            `orbitNotificationSettings:${userId}`,
            `orbitStudies:${userId}`
        ];

        localKeys.forEach((key) => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                try { local[key] = JSON.parse(value); }
                catch { local[key] = value; }
            }
        });

        const user = window.orbitCurrentUser || {};
        const payload = {
            exportedAt: new Date().toISOString(),
            app: "ORBIT",
            version: "1.1.0",
            account: {
                id: user.id || userId,
                email: user.email || null,
                name: user.user_metadata?.name || null,
                createdAt: user.created_at || null,
                lastSignInAt: user.last_sign_in_at || null
            },
            remote,
            local,
            notes: {
                unavailableEndpoints: unavailable,
                studyFiles: "Os arquivos binários do Storage não são incorporados ao JSON; o export contém os dados locais/metadados disponíveis."
            }
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        anchor.href = url;
        anchor.download = `orbit-backup-${date}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);

        setSettingsStatus(
            "settings-data-status",
            unavailable.length ? `Exportado. ${unavailable.length} fonte(s) não responderam.` : "Backup exportado com sucesso.",
            unavailable.length ? "" : "success"
        );
    } catch (error) {
        console.error("Erro ao exportar dados do ORBIT:", error);
        setSettingsStatus("settings-data-status", "Não foi possível gerar o backup.", "error");
    } finally {
        button && (button.disabled = false);
    }
}

function resetOrbitPreferences() {
    if (!window.orbitUserId) return;
    if (!window.confirm("Restaurar as preferências do ORBIT para os padrões? Seus dados não serão apagados.")) return;

    localStorage.removeItem(`orbitSettings:${window.orbitUserId}`);
    localStorage.removeItem(`orbitNotificationSettings:${window.orbitUserId}`);
    applyOrbitSettings();
    refreshNotificationSettingsUI();
    renderOrbitNotifications();
    setSettingsStatus("settings-reset-status", "Preferências restauradas.", "success");
}

async function checkOrbitBackendHealth() {
    const button = document.getElementById("settings-check-health");
    const title = document.getElementById("settings-health-title");
    const description = document.getElementById("settings-health-description");
    const status = document.getElementById("settings-backend-status");
    const dot = document.getElementById("settings-health-dot");

    if (button) button.disabled = true;
    if (title) title.textContent = "Verificando conexão...";
    if (description) description.textContent = "Consultando o servidor do ORBIT.";
    if (status) status.textContent = "Verificando...";
    if (dot) dot.style.background = "var(--warning)";

    try {
        const started = performance.now();
        const response = await fetch("/api/status", { cache: "no-store" });
        const elapsed = Math.round(performance.now() - started);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        if (title) title.textContent = "Tudo funcionando";
        if (description) description.textContent = `Servidor conectado em ${elapsed} ms.`;
        if (status) status.textContent = "Online";
        if (dot) dot.style.background = "var(--success)";
    } catch (error) {
        if (title) title.textContent = "Servidor indisponível";
        if (description) description.textContent = "Verifique se o backend do ORBIT está em execução.";
        if (status) status.textContent = "Offline";
        if (dot) dot.style.background = "var(--danger)";
    } finally {
        if (button) button.disabled = false;
    }
}

function initOrbitSettingsControls() {
    document.querySelectorAll(".settings-nav-item").forEach((button) => {
        button.addEventListener("click", () => {
            const sectionId = button.dataset.settingsSection;
            const section = document.getElementById(sectionId);
            if (!section) return;
            section.scrollIntoView({ behavior: getOrbitSettings().reducedMotion ? "auto" : "smooth", block: "start" });
            document.querySelectorAll(".settings-nav-item").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
        });
    });

    document.querySelectorAll(".settings-theme-option").forEach((button) => {
        button.addEventListener("click", () => {
            const accent = button.dataset.accent || "purple";
            updateOrbitSettings({ accent });
            applyOrbitAccent(accent);
        });
    });

    document.querySelectorAll(".settings-avatar-swatch").forEach((button) => {
        button.addEventListener("click", () => {
            const avatarColor = button.dataset.avatarColor || "purple";
            updateOrbitSettings({ avatarColor });
            applyOrbitAvatarColor(avatarColor);
        });
    });

    document.getElementById("settings-reduced-motion")?.addEventListener("change", (event) => {
        updateOrbitSettings({ reducedMotion: event.target.checked });
        applyOrbitSettings();
    });

    document.getElementById("settings-notification-badge-toggle")?.addEventListener("change", (event) => {
        updateOrbitSettings({ notificationBadge: event.target.checked });
        updateOrbitNotificationBadgeVisibility();
    });

    document.getElementById("settings-default-page")?.addEventListener("change", (event) => {
        updateOrbitSettings({ defaultPage: event.target.value });
    });

    document.getElementById("settings-remember-page")?.addEventListener("change", (event) => {
        updateOrbitSettings({ rememberPage: event.target.checked });
    });

    document.getElementById("settings-export-data")?.addEventListener("click", exportOrbitData);
    document.getElementById("settings-reset-preferences")?.addEventListener("click", resetOrbitPreferences);
    document.getElementById("settings-check-health")?.addEventListener("click", checkOrbitBackendHealth);

    const panels = [...document.querySelectorAll("[data-settings-panel]")];
    const navItems = [...document.querySelectorAll(".settings-nav-item")];
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!visible) return;
            navItems.forEach((item) => item.classList.toggle("active", item.dataset.settingsSection === visible.target.id));
        }, { root: null, rootMargin: "-110px 0px -55% 0px", threshold: [0.1, 0.35, 0.6] });
        panels.forEach((panel) => observer.observe(panel));
    }

    applyOrbitSettings();
    checkOrbitBackendHealth();
}

initOrbitSettingsControls();

window.addEventListener("orbit:auth-changed", (event) => {
    if (!event.detail?.user) {
        document.body.classList.remove("orbit-reduced-motion");
        return;
    }

    applyOrbitSettings();
    refreshNotificationSettingsUI();
    renderOrbitNotifications();

    const authEvent = event.detail?.event;
    if (authEvent === "INITIAL_SESSION" || authEvent === "SIGNED_IN") {
        setTimeout(() => {
            navigateToSavedOrbitPage();
            checkOrbitBackendHealth();
        }, 60);
    } else {
        checkOrbitBackendHealth();
    }
});

window.addEventListener("orbit:events-updated", () => {
    updateOrbitNotificationBadgeVisibility();
});

applyOrbitSettings();
