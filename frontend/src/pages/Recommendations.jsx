import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDevelopmentRecommendations } from "../api/ai";
import { createCategory, createLink, getAdminCategories } from "../api/links";
import "../styles/Recommendations.css";

function parsePrompt(value) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    topic: lines[0] || "",
    features: lines[1] || "",
    additional_context: lines.slice(2).join(" ") || "",
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function RecommendationSection({
  title,
  items,
  onSave,
  savingUrl,
  saveMessage,
}) {
  if (!items?.length) return null;

  return (
    <section className="recommendation-section">
      <div className="recommendation-section-head">
        <p className="recommendation-label">{title}</p>
      </div>
      <div className="recommendation-grid">
        {items.map((item) => (
          <article
            key={`${title}-${item.title}-${item.url}`}
            className="recommendation-card"
          >
            <a
              className="recommendation-card-link"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <div className="recommendation-card-top">
                <h3>{item.title}</h3>
                <span>visit</span>
              </div>
              <p className="recommendation-url">{item.url}</p>
              <p className="recommendation-description">{item.description}</p>
            </a>

            <div className="recommendation-card-actions">
              <button
                className="recommendation-save"
                type="button"
                onClick={() => onSave(item)}
                disabled={savingUrl === item.url}
              >
                {savingUrl === item.url ? "Saving..." : "Add to AI Picks"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {saveMessage && <p className="recommendation-save-message">{saveMessage}</p>}
    </section>
  );
}

export default function Recommendations() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [savingUrl, setSavingUrl] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const parsedPreview = useMemo(() => parsePrompt(prompt), [prompt]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = parsePrompt(prompt);

    if (!payload.topic || !payload.features) {
      setError("Use line 1 for topic and line 2 for core features.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSaveMessage("");
      const data = await getDevelopmentRecommendations(payload);
      setResult(data);
    } catch (submitError) {
      setError(submitError.message || "Failed to load recommendations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setError("");
    setResult(null);
    setIsLoading(false);
    setSavingUrl("");
    setSaveMessage("");
  };

  const ensureAIPicksCategory = async () => {
    const categories = await getAdminCategories();
    const existing = categories.find(
      (category) => category.name?.toLowerCase() === "ai picks",
    );

    if (existing) return existing;

    return createCategory({
      name: "AI Picks",
      slug: slugify("AI Picks"),
      sort_order: categories.length + 1,
      is_visible: true,
    });
  };

  const handleSaveRecommendation = async (item) => {
    try {
      setSavingUrl(item.url);
      setSaveMessage("");

      const category = await ensureAIPicksCategory();
      const categories = await getAdminCategories();
      const targetCategory = categories.find((entry) => entry.id === category.id) || category;
      const currentLinks = targetCategory.links || [];

      await createLink({
        category_id: category.id,
        title: item.title,
        url: item.url,
        description: item.description || null,
        icon_name: null,
        sort_order: currentLinks.length + 1,
        is_visible: true,
      });

      setSaveMessage(`Saved "${item.title}" to AI Picks.`);
    } catch (saveError) {
      setSaveMessage(saveError.message || "Could not save this site.");
    } finally {
      setSavingUrl("");
    }
  };

  return (
    <main className="recommendations-page">
      <section className="recommendations-shell">
        <div className="recommendations-header">
          <div>
            <p className="recommendations-kicker">AI Guide</p>
            <h1 className="recommendations-title">
              Build a product from a short brief
            </h1>
            <p className="recommendations-subtitle">
              Write 2-3 short lines about the product you want to build, and get
              useful APIs, websites, and reference apps to study.
            </p>
          </div>

          <div className="recommendations-header-actions">
            <Link to="/recommendations/history" className="recommendations-history-link">
              View history
            </Link>
            {result && (
              <button
                className="recommendations-reset"
                type="button"
                onClick={handleReset}
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        {!result && (
          <section className="recommendations-composer">
            <form className="recommendations-form" onSubmit={handleSubmit}>
              <label className="recommendations-label" htmlFor="brief">
                Describe your idea
              </label>
              <textarea
                id="brief"
                className="recommendations-textarea"
                placeholder={
                  "AI meeting notes service\nVoice upload, summary, action items, team sharing\nNeed to launch quickly as an MVP"
                }
                rows={7}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />

              <div className="recommendations-preview">
                <div>
                  <span>Topic</span>
                  <p>{parsedPreview.topic || "Write the product topic on line 1."}</p>
                </div>
                <div>
                  <span>Features</span>
                  <p>{parsedPreview.features || "Write the core features on line 2."}</p>
                </div>
                <div>
                  <span>Context</span>
                  <p>
                    {parsedPreview.additional_context ||
                      "Use line 3 for launch speed, constraints, or product goals."}
                  </p>
                </div>
              </div>

              {error && <p className="recommendations-error">{error}</p>}

              <button
                className="recommendations-submit"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Finding recommendations..." : "Get recommendations"}
              </button>
            </form>
          </section>
        )}

        {result && (
          <section className="recommendations-results">
            <section className="recommendation-note">
              <p className="recommendation-label">Quick Save</p>
              <p>
                Use the add button on any recommendation card to send it
                straight into your Sites list under the AI Picks category.
              </p>
            </section>

            <RecommendationSection
              title="Recommended Websites"
              items={result.websites}
              onSave={handleSaveRecommendation}
              savingUrl={savingUrl}
              saveMessage={saveMessage}
            />
            <RecommendationSection
              title="Reference Apps"
              items={result.apps}
              onSave={handleSaveRecommendation}
              savingUrl={savingUrl}
              saveMessage=""
            />

            <section className="recommendation-analysis">
              <p className="recommendation-label">Analysis</p>
              <p>{result.analysis}</p>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
