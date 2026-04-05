import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPublicLinks,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createLink,
  updateLink,
  deleteLink,
} from "../api/links";
import { getIsAdmin } from "../api/token";
import "../styles/Sites.css";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export default function Sites() {
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");

  const [newLinkByCategory, setNewLinkByCategory] = useState({});

  const [openCategoryEditorId, setOpenCategoryEditorId] = useState(null);
  const [openLinkEditorId, setOpenLinkEditorId] = useState(null);
  const [openNewLinkCategoryId, setOpenNewLinkCategoryId] = useState(null);

  useEffect(() => {
    const admin = getIsAdmin();
    setIsAdmin(admin);
  }, []);

  const loadData = async (adminMode) => {
    try {
      setIsLoading(true);
      setPageError("");

      const data = adminMode
        ? await getAdminCategories()
        : await getPublicLinks();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(error.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(isAdmin);
  }, [isAdmin]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    const name = newCategoryName.trim();
    const slug = newCategorySlug.trim() || slugify(name);

    if (!name || !slug) return;

    try {
      await createCategory({
        name,
        slug,
        sort_order: categories.length + 1,
        is_visible: true,
      });

      setNewCategoryName("");
      setNewCategorySlug("");
      await loadData(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCategoryFieldChange = (categoryId, field, value) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, [field]: value } : category,
      ),
    );
  };

  const handleSaveCategory = async (category) => {
    try {
      await updateCategory(category.id, {
        name: category.name,
        slug: category.slug,
        sort_order: Number(category.sort_order) || 0,
        is_visible: !!category.is_visible,
      });

      await loadData(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const ok = window.confirm("이 카테고리를 삭제할까요?");
    if (!ok) return;

    try {
      await deleteCategory(categoryId);
      await loadData(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLinkFieldChange = (categoryId, linkId, field, value) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;

        return {
          ...category,
          links: category.links.map((link) =>
            link.id === linkId ? { ...link, [field]: value } : link,
          ),
        };
      }),
    );
  };

  const handleSaveLink = async (link) => {
    try {
      await updateLink(link.id, {
        category_id: Number(link.category_id),
        title: link.title,
        url: link.url,
        description: link.description || null,
        icon_name: link.icon_name || null,
        sort_order: Number(link.sort_order) || 0,
        is_visible: !!link.is_visible,
      });

      await loadData(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteLink = async (linkId) => {
    const ok = window.confirm("이 링크를 삭제할까요?");
    if (!ok) return;

    try {
      await deleteLink(linkId);
      await loadData(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleNewLinkChange = (categoryId, field, value) => {
    setNewLinkByCategory((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value,
      },
    }));
  };

  const handleCreateLink = async (categoryId) => {
    const draft = newLinkByCategory[categoryId] || {};
    const title = (draft.title || "").trim();
    const url = (draft.url || "").trim();

    if (!title || !url) return;

    try {
      await createLink({
        category_id: categoryId,
        title,
        url,
        description: draft.description?.trim() || null,
        icon_name: null,
        sort_order: 0,
        is_visible: true,
      });

      setNewLinkByCategory((prev) => ({
        ...prev,
        [categoryId]: {
          title: "",
          url: "",
          description: "",
        },
      }));

      await loadData(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const compactCategories = useMemo(() => categories || [], [categories]);

  return (
    <div className="sites-page">
      <div className="sites-back-wrap">
        <Link to="/" className="sites-back-link">
          ← Back
        </Link>
      </div>

      <div className="sites-shell">
        <header className="sites-header">
          <div className="sites-header-row">
            <div>
              <p className="sites-kicker">Archive</p>
              <h1 className="sites-title">Sites</h1>
            </div>

            {isAdmin && <div className="admin-chip">admin</div>}
          </div>
        </header>

        {isAdmin && (
          <section className="admin-create-category">
            <form className="mini-inline-form" onSubmit={handleCreateCategory}>
              <input
                className="mini-input"
                placeholder="new category"
                value={newCategoryName}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewCategoryName(value);
                  setNewCategorySlug(slugify(value));
                }}
              />
              <input
                className="mini-input mini-input-slug"
                placeholder="slug"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
              />
              <button className="mini-action-button" type="submit">
                add
              </button>
            </form>
          </section>
        )}

        {isLoading && <p className="sites-info-text">Loading...</p>}
        {!isLoading && pageError && (
          <p className="sites-error-text">{pageError}</p>
        )}

        {!isLoading && !pageError && (
          <main className="sites-sections">
            {compactCategories.map((category) => (
              <section className="sites-section" key={category.id}>
                <div className="section-topline">
                  <div className="section-title-row">
                    <h2 className="section-title">{category.name}</h2>

                    {isAdmin && (
                      <button
                        className="plus-edit-button"
                        type="button"
                        onClick={() =>
                          setOpenCategoryEditorId(
                            openCategoryEditorId === category.id
                              ? null
                              : category.id,
                          )
                        }
                      >
                        edit
                      </button>
                    )}
                  </div>

                  {isAdmin && openCategoryEditorId === category.id && (
                    <div className="category-admin-row">
                      <input
                        className="category-title-input"
                        value={category.name}
                        onChange={(e) =>
                          handleCategoryFieldChange(
                            category.id,
                            "name",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        className="category-slug-input"
                        value={category.slug}
                        onChange={(e) =>
                          handleCategoryFieldChange(
                            category.id,
                            "slug",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        className="mini-text-button"
                        type="button"
                        onClick={() => handleSaveCategory(category)}
                      >
                        save
                      </button>
                      <button
                        className="mini-text-button mini-danger"
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="compact-link-list">
                  {category.links?.map((link) => (
                    <div key={link.id} className="link-block">
                      <div className="compact-link-row-wrap">
                        <a
                          className="compact-link-row"
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="compact-link-title">
                            {link.title}
                          </span>
                          <span className="compact-link-meta">
                            {link.description || link.url}
                          </span>
                        </a>

                        {isAdmin && (
                          <button
                            className="plus-edit-button link-plus"
                            type="button"
                            onClick={() =>
                              setOpenLinkEditorId(
                                openLinkEditorId === link.id ? null : link.id,
                              )
                            }
                          >
                            edit
                          </button>
                        )}
                      </div>

                      {isAdmin && openLinkEditorId === link.id && (
                        <div className="admin-link-row">
                          <input
                            className="link-edit-title"
                            value={link.title}
                            onChange={(e) =>
                              handleLinkFieldChange(
                                category.id,
                                link.id,
                                "title",
                                e.target.value,
                              )
                            }
                          />
                          <input
                            className="link-edit-url"
                            value={link.url}
                            onChange={(e) =>
                              handleLinkFieldChange(
                                category.id,
                                link.id,
                                "url",
                                e.target.value,
                              )
                            }
                          />
                          <input
                            className="link-edit-desc"
                            value={link.description || ""}
                            placeholder="note"
                            onChange={(e) =>
                              handleLinkFieldChange(
                                category.id,
                                link.id,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                          <button
                            className="mini-text-button"
                            type="button"
                            onClick={() => handleSaveLink(link)}
                          >
                            save
                          </button>
                          <button
                            className="mini-text-button mini-danger"
                            type="button"
                            onClick={() => handleDeleteLink(link.id)}
                          >
                            delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isAdmin && (
                    <div className="new-link-toggle-row">
                      <button
                        className="plus-edit-button"
                        type="button"
                        onClick={() =>
                          setOpenNewLinkCategoryId(
                            openNewLinkCategoryId === category.id
                              ? null
                              : category.id,
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  )}

                  {isAdmin && openNewLinkCategoryId === category.id && (
                    <div className="admin-new-link-row">
                      <input
                        className="link-edit-title"
                        placeholder="title"
                        value={newLinkByCategory[category.id]?.title || ""}
                        onChange={(e) =>
                          handleNewLinkChange(
                            category.id,
                            "title",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        className="link-edit-url"
                        placeholder="url"
                        value={newLinkByCategory[category.id]?.url || ""}
                        onChange={(e) =>
                          handleNewLinkChange(
                            category.id,
                            "url",
                            e.target.value,
                          )
                        }
                      />
                      <input
                        className="link-edit-desc"
                        placeholder="note"
                        value={
                          newLinkByCategory[category.id]?.description || ""
                        }
                        onChange={(e) =>
                          handleNewLinkChange(
                            category.id,
                            "description",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        className="mini-action-button"
                        type="button"
                        onClick={() => handleCreateLink(category.id)}
                      >
                        add
                      </button>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </main>
        )}
      </div>
    </div>
  );
}
