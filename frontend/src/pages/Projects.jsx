import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createProject,
  deleteProject,
  deleteProjectImage,
  getAdminProjects,
  getPublicProjects,
  updateProject,
  updateProjectImage,
  uploadProjectImage,
} from "../api/projects";
import { getIsAdmin } from "../api/token";
import "../styles/Projects.css";

const emptyProjectDraft = {
  project_key: "",
  title: "",
  subtitle: "",
  description: "",
  content_json: "{\n  \"sections\": []\n}",
  github_url: "",
  demo_url: "",
  tech_stack: "",
  started_at: "",
  ended_at: "",
  is_featured: false,
  is_visible: true,
  sort_order: 0,
};

const emptyImageDraft = {
  file: null,
  alt_text: "",
  caption: "",
  image_type: "screenshot",
  is_thumbnail: false,
  sort_order: 0,
};

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function getProjectImages(project) {
  return project?.images || project?.project_images || [];
}

function getThumbnail(project) {
  const images = getProjectImages(project);
  return (
    images.find((image) => image.is_thumbnail) ||
    images.find((image) => image.image_type === "thumbnail") ||
    images[0] ||
    null
  );
}

function getProjectDomKey(project) {
  return project?.id ?? project?.project_key;
}

function getProjectDraft(project) {
  if (!project) return emptyProjectDraft;

  return {
    project_key: project.project_key || "",
    title: project.title || "",
    subtitle: project.subtitle || "",
    description: project.description || "",
    content_json: JSON.stringify(project.content_json || { sections: [] }, null, 2),
    github_url: project.github_url || "",
    demo_url: project.demo_url || "",
    tech_stack: (project.tech_stack || []).join(", "),
    started_at: toInputDate(project.started_at),
    ended_at: toInputDate(project.ended_at),
    is_featured: !!project.is_featured,
    is_visible: project.is_visible !== false,
    sort_order: Number(project.sort_order) || 0,
  };
}

function buildProjectPayload(draft) {
  let contentJson = { sections: [] };

  if (draft.content_json.trim()) {
    contentJson = JSON.parse(draft.content_json);
  }

  return {
    project_key: draft.project_key.trim(),
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || null,
    description: draft.description.trim() || null,
    content_json: contentJson,
    github_url: draft.github_url.trim() || null,
    demo_url: draft.demo_url.trim() || null,
    tech_stack: draft.tech_stack
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    started_at: draft.started_at || null,
    ended_at: draft.ended_at || null,
    is_featured: !!draft.is_featured,
    is_visible: !!draft.is_visible,
    sort_order: Number(draft.sort_order) || 0,
  };
}

function getOrbitStyle(index, total) {
  const safeTotal = Math.max(total, 1);
  const angleStep = 28;
  const maxSpread = 148;
  const spread = Math.min(maxSpread, angleStep * Math.max(safeTotal - 1, 0));
  const angle = safeTotal === 1 ? 0 : -spread / 2 + (spread * index) / (safeTotal - 1);
  const radians = (angle * Math.PI) / 180;
  const radiusX = 118;
  const radiusY = 218;
  const x = 132 + Math.cos(radians) * radiusX;
  const y = 238 + Math.sin(radians) * radiusY;

  return {
    left: `${x}px`,
    top: `${y}px`,
  };
}

function ProjectModal({
  project,
  draft,
  imageDraft,
  isSaving,
  error,
  onDraftChange,
  onImageDraftChange,
  onClose,
  onSubmit,
  onDelete,
  onUploadImage,
  onUpdateImage,
  onDeleteImage,
}) {
  const images = getProjectImages(project);

  return (
    <div className="project-modal-backdrop" onClick={onClose}>
      <section className="project-modal" onClick={(event) => event.stopPropagation()}>
        <div className="project-modal-head">
          <div>
            <p className="project-kicker">Project editor</p>
            <h2>{project ? "Edit project" : "New project"}</h2>
          </div>
          <button className="project-modal-close" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <form className="project-form" onSubmit={onSubmit}>
          <div className="project-form-grid">
            <label>
              <span>Key</span>
              <input
                value={draft.project_key}
                onChange={(event) => onDraftChange("project_key", event.target.value)}
                placeholder="overwindow"
                required
              />
            </label>
            <label>
              <span>Title</span>
              <input
                value={draft.title}
                onChange={(event) => onDraftChange("title", event.target.value)}
                placeholder="OverWindow"
                required
              />
            </label>
            <label>
              <span>Subtitle</span>
              <input
                value={draft.subtitle}
                onChange={(event) => onDraftChange("subtitle", event.target.value)}
              />
            </label>
            <label>
              <span>Sort</span>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(event) => onDraftChange("sort_order", event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea
              value={draft.description}
              onChange={(event) => onDraftChange("description", event.target.value)}
              rows={3}
            />
          </label>

          <div className="project-form-grid">
            <label>
              <span>GitHub</span>
              <input
                value={draft.github_url}
                onChange={(event) => onDraftChange("github_url", event.target.value)}
                placeholder="https://github.com/example/repo"
              />
            </label>
            <label>
              <span>Demo</span>
              <input
                value={draft.demo_url}
                onChange={(event) => onDraftChange("demo_url", event.target.value)}
                placeholder="https://www.overwindow.com"
              />
            </label>
          </div>

          <label>
            <span>Tech stack</span>
            <input
              value={draft.tech_stack}
              onChange={(event) => onDraftChange("tech_stack", event.target.value)}
              placeholder="React, FastAPI, MySQL"
            />
          </label>

          <div className="project-form-grid">
            <label>
              <span>Started</span>
              <input
                type="date"
                value={draft.started_at}
                onChange={(event) => onDraftChange("started_at", event.target.value)}
              />
            </label>
            <label>
              <span>Ended</span>
              <input
                type="date"
                value={draft.ended_at}
                onChange={(event) => onDraftChange("ended_at", event.target.value)}
              />
            </label>
            <label className="project-check">
              <input
                type="checkbox"
                checked={draft.is_featured}
                onChange={(event) => onDraftChange("is_featured", event.target.checked)}
              />
              <span>Featured</span>
            </label>
            <label className="project-check">
              <input
                type="checkbox"
                checked={draft.is_visible}
                onChange={(event) => onDraftChange("is_visible", event.target.checked)}
              />
              <span>Visible</span>
            </label>
          </div>

          <label>
            <span>Content JSON</span>
            <textarea
              className="project-json-input"
              value={draft.content_json}
              onChange={(event) => onDraftChange("content_json", event.target.value)}
              rows={6}
            />
          </label>

          {error && <p className="project-form-error">{error}</p>}

          <div className="project-modal-actions">
            {project && (
              <button className="project-danger-button" type="button" onClick={onDelete}>
                Delete
              </button>
            )}
            <button className="project-save-button" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save project"}
            </button>
          </div>
        </form>

        {project && (
          <section className="project-image-editor">
            <div className="project-image-editor-head">
              <p className="project-kicker">Images</p>
            </div>

            <form className="project-image-upload" onSubmit={onUploadImage}>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  onImageDraftChange("file", event.target.files?.[0] || null)
                }
              />
              <input
                placeholder="alt text"
                value={imageDraft.alt_text}
                onChange={(event) => onImageDraftChange("alt_text", event.target.value)}
              />
              <input
                placeholder="caption"
                value={imageDraft.caption}
                onChange={(event) => onImageDraftChange("caption", event.target.value)}
              />
              <input
                placeholder="type"
                value={imageDraft.image_type}
                onChange={(event) => onImageDraftChange("image_type", event.target.value)}
              />
              <label className="project-check">
                <input
                  type="checkbox"
                  checked={imageDraft.is_thumbnail}
                  onChange={(event) =>
                    onImageDraftChange("is_thumbnail", event.target.checked)
                  }
                />
                <span>Thumbnail</span>
              </label>
              <button className="project-save-button" type="submit" disabled={isSaving}>
                Upload
              </button>
            </form>

            <div className="project-image-list">
              {images.map((image) => (
                <article className="project-image-row" key={image.id}>
                  <img
                    src={image.image_url}
                    alt={image.alt_text || ""}
                    width="88"
                    height="62"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <input
                      defaultValue={image.alt_text || ""}
                      placeholder="alt text"
                      onBlur={(event) =>
                        onUpdateImage(image, { alt_text: event.target.value })
                      }
                    />
                    <input
                      defaultValue={image.caption || ""}
                      placeholder="caption"
                      onBlur={(event) =>
                        onUpdateImage(image, { caption: event.target.value })
                      }
                    />
                  </div>
                  <button
                    className="project-danger-button"
                    type="button"
                    onClick={() => onDeleteImage(image.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

export default function Projects() {
  const isAdmin = getIsAdmin();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [modalProject, setModalProject] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(emptyProjectDraft);
  const [imageDraft, setImageDraft] = useState(emptyImageDraft);
  const [formError, setFormError] = useState("");
  const projectRefs = useRef({});

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
          String(a.title || "").localeCompare(String(b.title || "")),
      ),
    [projects],
  );

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError("");
      const data = isAdmin ? await getAdminProjects() : await getPublicProjects();
      const nextProjects = Array.isArray(data) ? data : [];
      setProjects(nextProjects);
      return nextProjects;
    } catch (error) {
      setPageError(error.message || "프로젝트를 불러오지 못했습니다.");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const openCreateModal = () => {
    setIsCreating(true);
    setModalProject(null);
    setDraft(emptyProjectDraft);
    setImageDraft(emptyImageDraft);
    setFormError("");
  };

  const openEditModal = (project) => {
    setIsCreating(false);
    setModalProject(project);
    setDraft(getProjectDraft(project));
    setImageDraft(emptyImageDraft);
    setFormError("");
  };

  const closeModal = () => {
    setIsCreating(false);
    setModalProject(null);
    setFormError("");
  };

  const handleDraftChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageDraftChange = (field, value) => {
    setImageDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitProject = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      setFormError("");
      const payload = buildProjectPayload(draft);

      if (isCreating) {
        await createProject(payload);
      } else {
        await updateProject(modalProject.id, payload);
      }

      await loadProjects();
      closeModal();
    } catch (error) {
      setFormError(error.message || "프로젝트 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!modalProject) return;
    const ok = window.confirm("프로젝트를 삭제하시겠습니까?");
    if (!ok) return;

    try {
      setIsSaving(true);
      await deleteProject(modalProject.id);
      await loadProjects();
      closeModal();
    } catch (error) {
      setFormError(error.message || "프로젝트 삭제에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadImage = async (event) => {
    event.preventDefault();
    if (!modalProject || !imageDraft.file) return;

    try {
      setIsSaving(true);
      setFormError("");
      await uploadProjectImage(modalProject.id, imageDraft);
      setImageDraft(emptyImageDraft);
      const nextProjects = await loadProjects();
      const refreshedProject = nextProjects.find((item) => item.id === modalProject.id);
      if (refreshedProject) {
        setModalProject(refreshedProject);
      }
    } catch (error) {
      setFormError(error.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateImage = async (image, patch) => {
    try {
      await updateProjectImage(image.id, {
        alt_text: image.alt_text || "",
        caption: image.caption || "",
        image_type: image.image_type || "screenshot",
        is_thumbnail: !!image.is_thumbnail,
        sort_order: Number(image.sort_order) || 0,
        ...patch,
      });
      const nextProjects = await loadProjects();
      const refreshedProject = nextProjects.find((item) => item.id === modalProject?.id);
      if (refreshedProject) {
        setModalProject(refreshedProject);
      }
    } catch (error) {
      setFormError(error.message || "이미지 수정에 실패했습니다.");
    }
  };

  const handleDeleteImage = async (imageId) => {
    const ok = window.confirm("이미지를 삭제하시겠습니까?");
    if (!ok) return;

    try {
      await deleteProjectImage(imageId);
      const nextProjects = await loadProjects();
      const refreshedProject = nextProjects.find((item) => item.id === modalProject?.id);
      if (refreshedProject) {
        setModalProject(refreshedProject);
      }
    } catch (error) {
      setFormError(error.message || "이미지 삭제에 실패했습니다.");
    }
  };

  const scrollToProject = (projectId) => {
    projectRefs.current[projectId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <main className="projects-page">
      <section className="projects-header">
        <div>
          <p className="project-kicker">Portfolio</p>
          <h1>Projects</h1>
        </div>
        {isAdmin && (
          <button className="project-new-button" type="button" onClick={openCreateModal}>
            New project
          </button>
        )}
      </section>

      {isLoading && <p className="projects-info">Loading...</p>}
      {!isLoading && pageError && <p className="projects-error">{pageError}</p>}

      {!isLoading && !pageError && (
        <section className="projects-layout">
          <aside className="projects-orbit-panel" aria-label="프로젝트 목록">
            <div className="projects-orbit">
              <div className="projects-orbit-ring" />
              {sortedProjects.map((project, index) => (
                <button
                  key={getProjectDomKey(project)}
                  className="project-orbit-item"
                  style={getOrbitStyle(index, sortedProjects.length)}
                  type="button"
                  onClick={() => scrollToProject(getProjectDomKey(project))}
                >
                  <span>{project.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="projects-stack">
            {sortedProjects.length === 0 && (
              <div className="project-empty">등록된 프로젝트가 없습니다.</div>
            )}

            {sortedProjects.map((project, index) => {
              const thumbnail = getThumbnail(project);
              const images = getProjectImages(project);
              const isFirstProject = index === 0;

              return (
                <article
                  className="project-card"
                  key={getProjectDomKey(project)}
                  ref={(node) => {
                    projectRefs.current[getProjectDomKey(project)] = node;
                  }}
                >
                  <div className="project-card-media">
                    {thumbnail ? (
                      <img
                        src={thumbnail.image_url}
                        alt={thumbnail.alt_text || project.title}
                        width="360"
                        height="240"
                        loading={isFirstProject ? "eager" : "lazy"}
                        fetchPriority={isFirstProject ? "high" : "low"}
                        decoding="async"
                      />
                    ) : (
                      <div className="project-card-placeholder">
                        {project.title?.slice(0, 1) || "P"}
                      </div>
                    )}
                  </div>

                  <div className="project-card-body">
                    <div className="project-card-top">
                      <div>
                        <p className="project-kicker">
                          {project.is_featured ? "Featured" : project.project_key}
                        </p>
                        <h2>{project.title}</h2>
                      </div>
                      {isAdmin && (
                        <button
                          className="project-edit-button"
                          type="button"
                          onClick={() => openEditModal(project)}
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {project.subtitle && (
                      <p className="project-subtitle">{project.subtitle}</p>
                    )}
                    {project.description && (
                      <p className="project-description">{project.description}</p>
                    )}

                    {project.tech_stack?.length > 0 && (
                      <div className="project-tech-list">
                        {project.tech_stack.map((tech) => (
                          <span key={`${project.id}-${tech}`}>{tech}</span>
                        ))}
                      </div>
                    )}

                    <div className="project-meta-row">
                      {(project.started_at || project.ended_at) && (
                        <span>
                          {toInputDate(project.started_at) || "Now"} -{" "}
                          {toInputDate(project.ended_at) || "Present"}
                        </span>
                      )}
                      {images.length > 0 && <span>{images.length} images</span>}
                    </div>

                    <div className="project-link-row">
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noreferrer">
                          GitHub
                        </a>
                      )}
                      {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noreferrer">
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      )}

      {(isCreating || modalProject) && (
        <ProjectModal
          project={modalProject}
          draft={draft}
          imageDraft={imageDraft}
          isSaving={isSaving}
          error={formError}
          onDraftChange={handleDraftChange}
          onImageDraftChange={handleImageDraftChange}
          onClose={closeModal}
          onSubmit={handleSubmitProject}
          onDelete={handleDeleteProject}
          onUploadImage={handleUploadImage}
          onUpdateImage={handleUpdateImage}
          onDeleteImage={handleDeleteImage}
        />
      )}
    </main>
  );
}
