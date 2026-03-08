/* =====================
   MOCK PROJECT DATA
   ===================== */
const projects = [
  {
    id: 1,
    title: "Autonomous Agent Orchestration Framework",
    description: "Multi-agent coordination layer using MCP protocol. Enables dynamic tool routing and inter-agent communication without a central controller.",
    domain: "MCP / Agents",
    status: "Building",
    priority: "Critical",
    complexity: "High",
    updatedAt: new Date("2025-07-08")
  },
  {
    id: 2,
    title: "Modular Bipedal Locomotion Research",
    description: "Kinematic model for low-cost bipedal walking using servo arrays and IMU feedback. Focused on stability over speed.",
    domain: "Robotics",
    status: "Researching",
    priority: "High",
    complexity: "High",
    updatedAt: new Date("2025-07-05")
  },
  {
    id: 3,
    title: "Custom USB-C PD Trigger PCB",
    description: "Compact negotiation board for USB Power Delivery. Targets 20V/5A output for bench supply replacement use cases.",
    domain: "Electronics",
    status: "Building",
    priority: "Medium",
    complexity: "Medium",
    updatedAt: new Date("2025-07-01")
  },
  {
    id: 4,
    title: "Sparse Autoencoder for Concept Mapping",
    description: "Experimental SAE trained on intermediate transformer activations. Goal is feature identification and circuit-level interpretability.",
    domain: "AI / ML",
    status: "Researching",
    priority: "High",
    complexity: "High",
    updatedAt: new Date("2025-06-28")
  },
  {
    id: 5,
    title: "Side-Channel Attack Surface Survey",
    description: "Survey of timing and power side-channels in embedded ARM devices. Mapping attack surfaces for future countermeasure design.",
    domain: "Cybersecurity",
    status: "Idea",
    priority: "Medium",
    complexity: "High",
    updatedAt: new Date("2025-06-20")
  },
  {
    id: 6,
    title: "RISC-V Soft Core on iCE40",
    description: "Minimal 32-bit RISC-V core implemented in Verilog targeting Lattice iCE40 FPGAs. No external dependencies, fully open toolchain.",
    domain: "Hardware",
    status: "Paused",
    priority: "High",
    complexity: "High",
    updatedAt: new Date("2025-06-14")
  },
  {
    id: 7,
    title: "Mechanistic Interpretability Lit Review",
    description: "Annotated reading list and notes covering the last 24 months of mechanistic interpretability papers from Anthropic and DeepMind.",
    domain: "Research",
    status: "Building",
    priority: "Medium",
    complexity: "Low",
    updatedAt: new Date("2025-07-06")
  },
  {
    id: 8,
    title: "Developer Tool for Agent Observability",
    description: "Lightweight SaaS concept: structured trace logging and replay for LLM agent pipelines. Target market is indie AI developers.",
    domain: "Business",
    status: "Idea",
    priority: "Medium",
    complexity: "Medium",
    updatedAt: new Date("2025-06-30")
  },
  {
    id: 9,
    title: "Low-Power Environmental Sensor Node",
    description: "Solar-powered BLE mesh sensor node for temperature, humidity, and CO2. Long-term deployment without manual maintenance.",
    domain: "Electronics",
    status: "Building",
    priority: "Low",
    complexity: "Medium",
    updatedAt: new Date("2025-06-22")
  },
  {
    id: 10,
    title: "Procedural World Generation Engine",
    description: "Voxel terrain generator using layered noise, biome logic, and erosion simulation. Pure C, no engine dependency.",
    domain: "Experimental",
    status: "Paused",
    priority: "Low",
    complexity: "High",
    updatedAt: new Date("2025-05-18")
  },
  {
    id: 11,
    title: "Network Packet Anomaly Classifier",
    description: "Lightweight ML model for classifying network traffic anomalies on edge hardware. Trained on synthetic attack scenarios.",
    domain: "Cybersecurity",
    status: "Researching",
    priority: "High",
    complexity: "Medium",
    updatedAt: new Date("2025-07-03")
  },
  {
    id: 12,
    title: "Writing System for Long-Form Thought",
    description: "Personal methodology for structured long-form thinking. Combines Zettelkasten principles with progressive summarization in plain text files.",
    domain: "Non-Technical",
    status: "Building",
    priority: "Low",
    complexity: "Low",
    updatedAt: new Date("2025-06-10")
  },
  {
    id: 13,
    title: "Archived: Mesh Radio Comms Prototype",
    description: "LoRa-based mesh radio prototype built for off-grid sensor networks. Deprecated in favor of BLE mesh approach.",
    domain: "Hardware",
    status: "Archived",
    priority: "Low",
    complexity: "Medium",
    updatedAt: new Date("2025-03-01")
  },
  {
    id: 14,
    title: "Transformer Positional Encoding Experiments",
    description: "Ablation experiments comparing RoPE, ALiBi, and learned positional encodings on small synthetic sequence tasks.",
    domain: "AI / ML",
    status: "Paused",
    priority: "Medium",
    complexity: "Medium",
    updatedAt: new Date("2025-05-25")
  },
  {
    id: 15,
    title: "Tool-Use Benchmark for Local Models",
    description: "Minimal benchmark suite for evaluating structured tool-calling accuracy in locally deployed language models. JSON schema-based.",
    domain: "MCP / Agents",
    status: "Idea",
    priority: "Critical",
    complexity: "Medium",
    updatedAt: new Date("2025-07-07")
  }
];

/* =====================
   PRIORITY & COMPLEXITY ORDERING
   Used for sorting
   ===================== */
const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const COMPLEXITY_ORDER = { High: 0, Medium: 1, Low: 2 };

/* =====================
   FILTER / SORT STATE
   ===================== */
let state = {
  search:     "",
  domain:     "all",
  status:     "all",
  priority:   "all",
  sort:       "updated",
  editingId:  null
};

/* =====================
   DOM REFERENCES
   ===================== */
const grid         = document.getElementById("project-grid");
const emptyState   = document.getElementById("empty-state");
const resultsCount = document.getElementById("results-count");
const searchInput  = document.getElementById("search-input");
const clearBtn     = document.getElementById("clear-filters");
const addBtn       = document.getElementById("btn-add-project");

// Modal
const modalBackdrop = document.getElementById("modal-backdrop");
const modalTitle    = document.getElementById("modal-title");
const modalClose    = document.getElementById("modal-close");
const modalCancel   = document.getElementById("modal-cancel");
const modalSave     = document.getElementById("modal-save");
const fieldTitle    = document.getElementById("field-title");
const fieldDesc     = document.getElementById("field-description");
const fieldDomain   = document.getElementById("field-domain");
const fieldStatus   = document.getElementById("field-status");
const fieldPriority = document.getElementById("field-priority");
const fieldComplex  = document.getElementById("field-complexity");

/* =====================
   FILTERING & SORTING
   ===================== */
function getFilteredProjects() {
  let result = projects.slice();

  // Text search: title + description
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.domain.toLowerCase().includes(q)
    );
  }

  // Domain filter
  if (state.domain !== "all") {
    result = result.filter(p => p.domain === state.domain);
  }

  // Status filter
  if (state.status !== "all") {
    result = result.filter(p => p.status === state.status);
  }

  // Priority filter
  if (state.priority !== "all") {
    result = result.filter(p => p.priority === state.priority);
  }

  // Sort
  if (state.sort === "updated") {
    result.sort((a, b) => b.updatedAt - a.updatedAt);
  } else if (state.sort === "priority") {
    result.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  } else if (state.sort === "complexity") {
    result.sort((a, b) => COMPLEXITY_ORDER[a.complexity] - COMPLEXITY_ORDER[b.complexity]);
  }

  return result;
}

/* =====================
   RENDERING
   ===================== */
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function statusClass(status) {
  return `badge--status-${status.toLowerCase()}`;
}

function complexityClass(complexity) {
  return `badge--complexity-${complexity.toLowerCase()}`;
}

function priorityDotClass(priority) {
  return `priority-dot--${priority.toLowerCase()}`;
}

function renderCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  card.dataset.id = project.id;

  card.innerHTML = `
    <div class="card__header">
      <h2 class="card__title">${escapeHtml(project.title)}</h2>
    </div>

    <p class="card__description">${escapeHtml(project.description)}</p>

    <div class="card__badges">
      <span class="badge badge--domain">${escapeHtml(project.domain)}</span>
      <span class="badge ${statusClass(project.status)}">${escapeHtml(project.status)}</span>
    </div>

    <div class="card__footer">
      <div class="card__meta">
        <span class="priority-indicator">
          <span class="priority-dot ${priorityDotClass(project.priority)}"></span>
          ${escapeHtml(project.priority)}
        </span>
        <span class="badge ${complexityClass(project.complexity)}">${escapeHtml(project.complexity)}</span>
        <span class="card__updated">${formatDate(project.updatedAt)}</span>
      </div>
      <div class="card__actions">
        <button
          class="card__action-btn"
          data-action="edit"
          data-id="${project.id}"
          aria-label="Edit project"
          title="Edit"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
          class="card__action-btn"
          data-action="delete"
          data-id="${project.id}"
          aria-label="Delete project"
          title="Delete"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 4h10M6 4V2.5h4V4M5 4v8.5h6V4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  return card;
}

function renderGrid() {
  const filtered = getFilteredProjects();
  grid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.hidden = false;
    resultsCount.textContent = "0 projects";
  } else {
    emptyState.hidden = true;
    const count = filtered.length;
    resultsCount.textContent = `${count} project${count !== 1 ? "s" : ""}`;

    const fragment = document.createDocumentFragment();
    filtered.forEach(project => fragment.appendChild(renderCard(project)));
    grid.appendChild(fragment);
  }
}

/* =====================
   HELPERS
   ===================== */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setActiveFilter(groupId, value) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset[Object.keys(btn.dataset)[0]] === value);
  });
}

/* =====================
   FILTER BUTTON WIRING
   ===================== */
function initFilterGroup(groupId, stateKey) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    const val = btn.dataset[stateKey];
    if (!val) return;
    state[stateKey] = val;
    setActiveFilter(groupId, val);
    renderGrid();
  });
}

/* =====================
   SEARCH INPUT
   ===================== */
function initSearch() {
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    renderGrid();
  });
}

/* =====================
   CLEAR FILTERS
   ===================== */
function clearAllFilters() {
  state.search   = "";
  state.domain   = "all";
  state.status   = "all";
  state.priority = "all";
  state.sort     = "updated";

  searchInput.value = "";

  setActiveFilter("sort-group",     "updated");
  setActiveFilter("domain-group",   "all");
  setActiveFilter("status-group",   "all");
  setActiveFilter("priority-group", "all");

  renderGrid();
}

/* =====================
   MODAL
   ===================== */
function openModal(project = null) {
  if (project) {
    modalTitle.textContent    = "Edit Project";
    fieldTitle.value          = project.title;
    fieldDesc.value           = project.description;
    fieldDomain.value         = project.domain;
    fieldStatus.value         = project.status;
    fieldPriority.value       = project.priority;
    fieldComplex.value        = project.complexity;
    state.editingId           = project.id;
  } else {
    modalTitle.textContent    = "New Project";
    fieldTitle.value          = "";
    fieldDesc.value           = "";
    fieldDomain.value         = "AI / ML";
    fieldStatus.value         = "Idea";
    fieldPriority.value       = "Medium";
    fieldComplex.value        = "Medium";
    state.editingId           = null;
  }

  modalBackdrop.hidden = false;
  setTimeout(() => fieldTitle.focus(), 30);
}

function closeModal() {
  modalBackdrop.hidden = true;
  state.editingId = null;
}

function saveProject() {
  const title = fieldTitle.value.trim();
  if (!title) {
    fieldTitle.focus();
    return;
  }

  const data = {
    title:       title,
    description: fieldDesc.value.trim() || "No description.",
    domain:      fieldDomain.value,
    status:      fieldStatus.value,
    priority:    fieldPriority.value,
    complexity:  fieldComplex.value,
    updatedAt:   new Date()
  };

  if (state.editingId !== null) {
    // Update existing
    const idx = projects.findIndex(p => p.id === state.editingId);
    if (idx !== -1) {
      Object.assign(projects[idx], data);
    }
  } else {
    // Add new
    const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    projects.unshift({ id: newId, ...data });
  }

  closeModal();
  renderGrid();
}

/* =====================
   CARD ACTION DELEGATION
   ===================== */
function initCardActions() {
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id     = parseInt(btn.dataset.id, 10);
    const project = projects.find(p => p.id === id);

    if (action === "edit" && project) {
      openModal(project);
    }

    if (action === "delete" && project) {
      const idx = projects.indexOf(project);
      if (idx !== -1) {
        projects.splice(idx, 1);
        renderGrid();
      }
    }
  });
}

/* =====================
   KEYBOARD HANDLING
   ===================== */
function initKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalBackdrop.hidden) {
      closeModal();
    }
  });

  // Save on Ctrl/Cmd+Enter inside modal
  modalBackdrop.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      saveProject();
    }
  });
}

/* =====================
   BACKDROP CLICK
   ===================== */
function initBackdropClose() {
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
}

/* =====================
   INIT
   ===================== */
(function init() {
  initSearch();
  initFilterGroup("sort-group",     "sort");
  initFilterGroup("domain-group",   "domain");
  initFilterGroup("status-group",   "status");
  initFilterGroup("priority-group", "priority");

  clearBtn.addEventListener("click", clearAllFilters);
  addBtn.addEventListener("click", () => openModal());
  modalClose.addEventListener("click", closeModal);
  modalCancel.addEventListener("click", closeModal);
  modalSave.addEventListener("click", saveProject);

  initCardActions();
  initKeyboard();
  initBackdropClose();

  renderGrid();
})();
