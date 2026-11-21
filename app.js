(() => {
  "use strict";

  const STORAGE_KEY = "taskflow.tasks";

  const $ = (sel) => document.querySelector(sel);
  const els = {
    sidebar: $("#sidebar"),
    backdrop: $("#backdrop"),
    menuBtn: $("#menuBtn"),
    greeting: $("#greeting"),
    todayDate: $("#todayDate"),
    welcomeText: $("#welcomeText"),
    ringFg: $("#ringFg"),
    ringLabel: $("#ringLabel"),
    statTotal: $("#statTotal"),
    statDone: $("#statDone"),
    statPending: $("#statPending"),
    statRate: $("#statRate"),
    progressBar: $("#progressBar"),
    progressFill: $("#progressFill"),
    form: $("#addForm"),
    input: $("#taskInput"),
    priority: $("#prioritySelect"),
    list: $("#taskList"),
    empty: $("#emptyState"),
    emptyTitle: $("#emptyTitle"),
    emptyText: $("#emptyText"),
  };

  /* ---------- State ---------- */
  let tasks = load();
  let filter = "all";

  function sampleTasks() {
    const now = Date.now();
    return [
      { id: uid(), title: "Plan the week's priorities", priority: "high", completed: false, createdAt: now },
      { id: uid(), title: "Review project proposal", priority: "medium", completed: false, createdAt: now - 1 },
      { id: uid(), title: "Reply to team emails", priority: "low", completed: true, createdAt: now - 2 },
    ];
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return sampleTasks();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : sampleTasks();
    } catch {
      return sampleTasks();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* storage unavailable (private mode etc.) — app still works in memory */
    }
  }

  function uid() {
    return (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /* ---------- Actions ---------- */
  function addTask(title, priority) {
    const clean = title.trim();
    if (!clean) return false;
    tasks.unshift({ id: uid(), title: clean, priority, completed: false, createdAt: Date.now() });
    save();
    render();
    return true;
  }

  function toggleTask(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    render();
  }

  function deleteTask(id, rowEl) {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      tasks = tasks.filter((x) => x.id !== id);
      save();
      render();
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rowEl && !reduce) {
      rowEl.classList.add("removing");
      rowEl.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 400); // fallback if transitionend doesn't fire
    } else {
      finish();
    }
  }

  function setFilter(next) {
    filter = next;
    document.querySelectorAll(".filter").forEach((b) => {
      const on = b.dataset.filter === next;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll(".nav-link[data-filter]").forEach((a) => {
      a.classList.toggle("active", a.dataset.filter === next);
    });
    render();
  }

  /* ---------- Rendering ---------- */
  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

  function relativeTime(ts) {
    const diff = Math.round((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function taskRow(t) {
    const li = document.createElement("li");
    li.className = `task${t.completed ? " done" : ""}`;
    li.dataset.id = t.id;

    const check = document.createElement("button");
    check.className = "check";
    check.type = "button";
    check.dataset.action = "toggle";
    check.setAttribute("aria-label", t.completed ? `Mark "${t.title}" as not completed` : `Mark "${t.title}" as completed`);
    check.setAttribute("aria-pressed", String(t.completed));
    check.innerHTML = ICON_CHECK;

    const body = document.createElement("div");
    body.className = "task-body";
    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = t.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const pill = document.createElement("span");
    const prio = ["high", "medium", "low"].includes(t.priority) ? t.priority : "medium";
    pill.className = `pill pill-${prio}`;
    pill.textContent = prio;
    const time = document.createElement("span");
    time.textContent = relativeTime(t.createdAt);
    meta.append(pill, time);
    body.append(title, meta);

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.type = "button";
    del.dataset.action = "delete";
    del.setAttribute("aria-label", `Delete "${t.title}"`);
    del.innerHTML = ICON_TRASH;

    li.append(check, body, del);
    return li;
  }

  function render() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const pending = total - done;
    const rate = total ? Math.round((done / total) * 100) : 0;

    els.statTotal.textContent = total;
    els.statDone.textContent = done;
    els.statPending.textContent = pending;
    els.statRate.textContent = `${rate}%`;
    els.progressFill.style.width = `${rate}%`;
    els.progressBar.setAttribute("aria-valuenow", String(rate));
    els.ringFg.style.strokeDashoffset = String(100 - rate);
    els.ringLabel.textContent = `${rate}%`;

    els.welcomeText.textContent =
      total === 0 ? "Add a task to start your day." :
      pending === 0 ? "All tasks done — great work! 🎉" :
      `You have ${pending} pending task${pending === 1 ? "" : "s"} today.`;

    const visible = tasks.filter((t) =>
      filter === "active" ? !t.completed : filter === "completed" ? t.completed : true
    );

    els.list.replaceChildren(...visible.map(taskRow));

    const isEmpty = visible.length === 0;
    els.empty.hidden = !isEmpty;
    if (isEmpty) {
      if (total === 0) {
        els.emptyTitle.textContent = "No tasks yet";
        els.emptyText.textContent = "Add your first task above to get started.";
      } else if (filter === "active") {
        els.emptyTitle.textContent = "Nothing pending";
        els.emptyText.textContent = "You've completed everything. Nice!";
      } else {
        els.emptyTitle.textContent = "No completed tasks";
        els.emptyText.textContent = "Finish a task and it will show up here.";
      }
    }
  }

  function renderHeader() {
    const now = new Date();
    const h = now.getHours();
    els.greeting.textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    els.todayDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric",
    });
  }

  /* ---------- Sidebar drawer ---------- */
  function openSidebar() {
    els.sidebar.classList.add("open");
    els.backdrop.hidden = false;
    els.menuBtn.setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    els.sidebar.classList.remove("open");
    els.backdrop.hidden = true;
    els.menuBtn.setAttribute("aria-expanded", "false");
  }

  /* ---------- Events ---------- */
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (addTask(els.input.value, els.priority.value)) {
      els.input.value = "";
      if (filter === "completed") setFilter("all");
    }
    els.input.focus();
  });

  els.list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest(".task");
    const id = row && row.dataset.id;
    if (!id) return;
    if (btn.dataset.action === "toggle") toggleTask(id);
    else if (btn.dataset.action === "delete") deleteTask(id, row);
  });

  document.querySelectorAll(".filter").forEach((b) =>
    b.addEventListener("click", () => setFilter(b.dataset.filter))
  );

  document.querySelectorAll(".nav-link").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (a.dataset.filter) setFilter(a.dataset.filter);
      closeSidebar();
    })
  );

  els.menuBtn.addEventListener("click", () =>
    els.sidebar.classList.contains("open") ? closeSidebar() : openSidebar()
  );
  els.backdrop.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });

  renderHeader();
  render();
})();
