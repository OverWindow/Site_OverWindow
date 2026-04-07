import { useMemo, useState } from "react";
import { getDevelopmentRecommendations } from "../api/ai";
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

function RecommendationSection({ title, items }) {
  if (!items?.length) return null;

  return (
    <section className="recommendation-section">
      <div className="recommendation-section-head">
        <p className="recommendation-label">{title}</p>
      </div>
      <div className="recommendation-grid">
        {items.map((item) => (
          <a
            key={`${title}-${item.title}-${item.url}`}
            className="recommendation-card"
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
        ))}
      </div>
    </section>
  );
}

export default function Recommendations() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

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
            <RecommendationSection
              title="Recommended Websites"
              items={result.websites}
            />
            <RecommendationSection title="Reference Apps" items={result.apps} />

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
