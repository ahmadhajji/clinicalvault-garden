import { Link } from "react-router-dom";

export function NotFoundRoute() {
  return (
    <main className="note-page">
      <p className="state error">This page does not exist.</p>
      <Link to="/" className="ghost-btn">
        Back to library
      </Link>
    </main>
  );
}
