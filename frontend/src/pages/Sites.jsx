import { useEffect, useMemo, useState } from "react";
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

function reorderItems(items, draggedId, targetId) {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [draggedItem] = nextItems.splice(draggedIndex, 1);
  nextItems.splice(targetIndex, 0, draggedItem);
  return nextItems;
}

function applySortOrder(items) {
  return items.map((item, index) => ({
    ...item,
    sort_order: index + 1,
  }));
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
  const [isSiteEditOpen, setIsSiteEditOpen] = useState(false);
  const [draggingCategoryId, setDraggingCategoryId] = useState(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState(null);
  const [draggingLinkMeta, setDraggingLinkMeta] = useState(null);
  const [dragOverLinkId, setDragOverLinkId] = useState(null);

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
      setPageError(error.message || "아이디를 불러오지 못했습니다");
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

  const persistCategoryOrder = async (orderedCategories) => {
    await Promise.all(
      orderedCategories.map((category) =>
        updateCategory(category.id, {
          name: category.name,
          slug: category.slug,
          sort_order: Number(category.sort_order) || 0,
          is_visible: !!category.is_visible,
        }),
      ),
    );
  };

  const handleDeleteCategory = async (categoryId) => {
    const ok = window.confirm("카테고리를 지우시겠습니까?");
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
    const ok = window.confirm("링크를 삭제하시겠습니까?");
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
      setOpenNewLinkCategoryId((prev) => (prev === categoryId ? null : prev));

      await loadData(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const persistLinkOrder = async (links) => {
    await Promise.all(
      links.map((link) =>
        updateLink(link.id, {
          category_id: Number(link.category_id),
          title: link.title,
          url: link.url,
          description: link.description || null,
          icon_name: link.icon_name || null,
          sort_order: Number(link.sort_order) || 0,
          is_visible: !!link.is_visible,
        }),
      ),
    );
  };

  const handleCategoryDragStart = (categoryId) => {
    setDraggingCategoryId(categoryId);
  };

  const handleCategoryDragOver = (e, categoryId) => {
    if (!isSiteEditOpen || draggingCategoryId == null) return;

    e.preventDefault();
    if (dragOverCategoryId !== categoryId) {
      setDragOverCategoryId(categoryId);
    }
  };

  const handleCategoryDrop = async (categoryId) => {
    if (!isSiteEditOpen || draggingCategoryId == null) return;

    const reorderedCategories = reorderItems(categories, draggingCategoryId, categoryId);
    const nextCategories = applySortOrder(reorderedCategories);

    setDraggingCategoryId(null);
    setDragOverCategoryId(null);

    if (reorderedCategories === categories) return;

    setCategories(nextCategories);

    try {
      await persistCategoryOrder(nextCategories);
      await loadData(true);
    } catch (error) {
      alert(error.message);
      await loadData(true);
    }
  };

  const handleCategoryDragEnd = () => {
    setDraggingCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleLinkDragStart = (e, categoryId, linkId) => {
    e.stopPropagation();
    setDraggingLinkMeta({ categoryId, linkId });
  };

  const handleLinkDragOver = (e, categoryId, linkId) => {
    if (
      !draggingLinkMeta ||
      draggingLinkMeta.categoryId !== categoryId ||
      openCategoryEditorId !== categoryId
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    if (dragOverLinkId !== linkId) {
      setDragOverLinkId(linkId);
    }
  };

  const handleLinkDrop = async (e, categoryId, linkId) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !draggingLinkMeta ||
      draggingLinkMeta.categoryId !== categoryId ||
      openCategoryEditorId !== categoryId
    ) {
      return;
    }

    const nextCategories = categories.map((category) => {
      if (category.id !== categoryId) return category;

      const reorderedLinks = reorderItems(
        category.links || [],
        draggingLinkMeta.linkId,
        linkId,
      );

      return {
        ...category,
        links: applySortOrder(reorderedLinks),
      };
    });

    const targetCategory = nextCategories.find((category) => category.id === categoryId);

    setDraggingLinkMeta(null);
    setDragOverLinkId(null);

    if (!targetCategory) return;

    setCategories(nextCategories);

    try {
      await persistLinkOrder(targetCategory.links || []);
      await loadData(true);
    } catch (error) {
      alert(error.message);
      await loadData(true);
    }
  };

  const handleLinkDragEnd = (e) => {
    e.stopPropagation();
    setDraggingLinkMeta(null);
    setDragOverLinkId(null);
  };

  const compactCategories = useMemo(() => categories || [], [categories]);

  return (
    <div className="sites-page">
      <div className="sites-shell">
        <header className="sites-header">
          <div className="sites-header-row">
            <div className="sites-header-copy">
              <p className="sites-kicker">Archive</p>
              <div className="sites-title-row">
                <h1 className="sites-title">Sites</h1>
                {isAdmin && (
                  <button
                    className="plus-edit-button sites-edit-button"
                    type="button"
                    onClick={() => setIsSiteEditOpen((prev) => !prev)}
                  >
                    {isSiteEditOpen ? "done" : "edit"}
                  </button>
                )}
              </div>
            </div>

            {isAdmin && isSiteEditOpen && (
              <section className="admin-create-category">
                <form
                  className="mini-inline-form"
                  onSubmit={handleCreateCategory}
                >
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
          </div>
        </header>

        {isLoading && <p className="sites-info-text">Loading...</p>}
        {!isLoading && pageError && (
          <p className="sites-error-text">{pageError}</p>
        )}

        {!isLoading && !pageError && (
          <main className="sites-sections">
            {compactCategories.map((category) => (
              <section
                className={`sites-section ${
                  isAdmin && isSiteEditOpen ? "sites-section-draggable" : ""
                } ${
                  dragOverCategoryId === category.id ? "is-drag-over" : ""
                }`}
                key={category.id}
                draggable={isAdmin && isSiteEditOpen}
                onDragStart={() => handleCategoryDragStart(category.id)}
                onDragOver={(e) => handleCategoryDragOver(e, category.id)}
                onDrop={() => handleCategoryDrop(category.id)}
                onDragEnd={handleCategoryDragEnd}
              >
                <div className="section-topline">
                  <div className="section-title-row">
                    <h2 className="section-title">{category.name}</h2>

                    {isAdmin && isSiteEditOpen && (
                      <span className="drag-order-chip">drag</span>
                    )}

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
                    <form
                      className="category-admin-row"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCategory(category);
                      }}
                    >
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
                      <button className="mini-text-button" type="submit">
                        save
                      </button>
                      <button
                        className="mini-text-button mini-danger"
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        delete
                      </button>
                    </form>
                  )}
                </div>

                <div className="compact-link-list">
                  {category.links?.map((link) => (
                    <div
                      key={link.id}
                      className={`link-block ${
                        isAdmin && openCategoryEditorId === category.id
                          ? "link-block-draggable"
                          : ""
                      } ${
                        dragOverLinkId === link.id &&
                        draggingLinkMeta?.categoryId === category.id
                          ? "is-drag-over"
                          : ""
                      }`}
                      draggable={isAdmin && openCategoryEditorId === category.id}
                      onDragStart={(e) => handleLinkDragStart(e, category.id, link.id)}
                      onDragOver={(e) => handleLinkDragOver(e, category.id, link.id)}
                      onDrop={(e) => handleLinkDrop(e, category.id, link.id)}
                      onDragEnd={(e) => handleLinkDragEnd(e)}
                    >
                      <div className="compact-link-row-wrap">
                        <a
                          className="compact-link-row"
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <div className="compact-link-main">
                            {link.favicon_url && (
                              <img
                                className="link-favicon"
                                src={link.favicon_url}
                                alt=""
                                loading="lazy"
                              />
                            )}
                            <span className="compact-link-title">
                              {link.title}
                            </span>
                          </div>
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

                      {isAdmin && openCategoryEditorId === category.id && (
                        <div className="drag-link-hint">drag to reorder</div>
                      )}

                      {isAdmin && openLinkEditorId === link.id && (
                        <form
                          className="admin-link-row"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveLink(link);
                          }}
                        >
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

                          <div className="admin-link-actions">
                            <button className="mini-text-button" type="submit">
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
                        </form>
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
                    <form
                      className="admin-new-link-row"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateLink(category.id);
                      }}
                    >
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

                      <div className="admin-link-actions">
                        <button className="mini-action-button" type="submit">
                          add
                        </button>
                      </div>
                    </form>
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
