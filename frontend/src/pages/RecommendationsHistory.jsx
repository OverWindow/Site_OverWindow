import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendationHistory } from "../api/ai";
import "../styles/Recommendations.css";

function formatDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function RecommendationsHistory() {
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        setError("");
        const data = await getRecommendationHistory();
        setHistory(data);
        setSelectedId(data[0]?.id ?? null);
      } catch (loadError) {
        setError(loadError.message || "Failed to load history.");
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, []);

  const selectedItem = useMemo(
    () => history.find((entry) => entry.id === selectedId) || history[0] || null,
    [history, selectedId],
  );

  return (
    <main className="recommendations-page">
      <section className="recommendations-shell">
        <div className="recommendations-header">
          <div>
            <p className="recommendations-kicker">AI Guide</p>
            <h1 className="recommendations-title">Recommendation history</h1>
            <p className="recommendations-subtitle">
              Browse your earlier prompts, then open each one to review the
              websites, apps, and analysis that AI returned.
            </p>
          </div>

          <div className="recommendations-header-actions">
            <Link to="/recommendations" className="recommendations-history-link">
              Back to AI Picks
            </Link>
          </div>
        </div>

        {isLoading && <p className="recommendations-error">Loading...</p>}
        {!isLoading && error && <p className="recommendations-error">{error}</p>}

        {!isLoading && !error && (
          <section className="recommendation-history-layout">
            <aside className="recommendation-history-list">
              {history.length === 0 && (
                <div className="recommendation-history-empty">
                  No saved recommendation history yet.
                </div>
              )}

              {history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`recommendation-history-item ${
                    selectedItem?.id === entry.id ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <span className="recommendation-history-date">
                    {formatDate(entry.created_at)}
                  </span>
                  <strong>{entry.topic}</strong>
                  <p>{entry.features}</p>
                </button>
              ))}
            </aside>

            <section className="recommendation-history-detail">
              {!selectedItem && (
                <div className="recommendation-history-empty">
                  Select a request to see the full answer.
                </div>
              )}

              {selectedItem && (
                <>
                  <section className="recommendation-note">
                    <p className="recommendation-label">Prompt</p>
                    <div className="recommendation-history-meta">
                      <p>
                        <strong>Topic</strong>
                        <span>{selectedItem.topic}</span>
                      </p>
                      <p>
                        <strong>Features</strong>
                        <span>{selectedItem.features}</span>
                      </p>
                      <p>
                        <strong>Context</strong>
                        <span>{selectedItem.additional_context || "None"}</span>
                      </p>
                    </div>
                  </section>

                  <section className="recommendation-section">
                    <div className="recommendation-section-head">
                      <p className="recommendation-label">Returned items</p>
                    </div>
                    <div className="recommendation-grid">
                      {selectedItem.items?.map((item) => (
                        <article
                          key={`${selectedItem.id}-${item.id}`}
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
                              <span>{item.type}</span>
                            </div>
                            <p className="recommendation-url">{item.url}</p>
                            <p className="recommendation-description">
                              {item.description}
                            </p>
                          </a>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="recommendation-analysis">
                    <p className="recommendation-label">Analysis</p>
                    <p>{selectedItem.analysis}</p>
                  </section>
                </>
              )}
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
