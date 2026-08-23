/* =====================================================
   ORBIT — SCRIPT PRINCIPAL
===================================================== */


/* =====================================================
   NAVEGAÇÃO
===================================================== */

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach((item) => {

    item.addEventListener("click", (event) => {

        event.preventDefault();

        const pageId = item.dataset.page;

        if (!pageId) {
            return;
        }

        pages.forEach((page) => {
            page.classList.add("hidden");
        });

        const selectedPage =
            document.getElementById(pageId);

        if (selectedPage) {
            selectedPage.classList.remove("hidden");
        }

        navItems.forEach((navItem) => {
            navItem.classList.remove("active");
        });

        item.classList.add("active");

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


let tasks =
    JSON.parse(
        localStorage.getItem("orbitTasks")
    ) || [];


let currentTaskFilter = "all";


function saveTasks() {

    localStorage.setItem(
        "orbitTasks",
        JSON.stringify(tasks)
    );

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

const eventNotes =
    document.getElementById("event-notes");

const agenda =
    document.getElementById("agenda");

const calendarDate =
    document.getElementById("calendar-date");

const calendarWeekday =
    document.getElementById("calendar-weekday");

const previousDay =
    document.getElementById("previous-day");

const nextDay =
    document.getElementById("next-day");


let events =
    JSON.parse(
        localStorage.getItem("orbitEvents")
    ) || [];


let selectedDate = new Date();


function saveEvents() {

    localStorage.setItem(
        "orbitEvents",
        JSON.stringify(events)
    );

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
                    event.date === dateString
            )
            .sort(
                (a, b) =>
                    (a.start || "")
                        .localeCompare(
                            b.start || ""
                        )
            );


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


function scheduleReminder(event) {

    if (
        event.reminder === "none" ||
        !event.start ||
        !event.date
    ) {

        return;

    }


    const eventDateTime =
        new Date(
            `${event.date}T${event.start}:00`
        );


    const reminderMinutes =
        Number(event.reminder);


    const reminderTime =
        eventDateTime.getTime() -
        reminderMinutes * 60 * 1000;


    const delay =
        reminderTime -
        Date.now();


    if (delay <= 0) {
        return;
    }


    setTimeout(
        () => {

            showReminder(event);

        },
        delay
    );

}


function showReminder(event) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            "ORBIT — Lembrete 🔔",
            {
                body: event.title
            }
        );

    } else {

        alert(
            `🔔 Lembrete ORBIT\n\n${event.title}`
        );

    }

}


function requestNotificationPermission() {

    if (
        "Notification" in window &&
        Notification.permission === "default"
    ) {

        Notification.requestPermission();

    }

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


let projects =
    JSON.parse(
        localStorage.getItem(
            "orbitProjects"
        )
    ) || [];


let currentProjectFilter = "all";

let editingProjectId = null;


function saveProjects() {

    localStorage.setItem(
        "orbitProjects",
        JSON.stringify(projects)
    );

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
            `Excluir o projeto "${project.name}"?`
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


let projectTasks =
    JSON.parse(
        localStorage.getItem(
            "orbitProjectTasks"
        )
    ) || [];


function saveProjectTasks() {

    localStorage.setItem(
        "orbitProjectTasks",
        JSON.stringify(
            projectTasks
        )
    );

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

renderTasks();

updateCalendarHeader();

renderProjects();

updateProjectStats();

renderDashboardProjects();

requestNotificationPermission();


events.forEach(
    (event) => {

        scheduleReminder(event);

    }
);