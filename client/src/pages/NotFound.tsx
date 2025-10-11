// src/pages/NotFound.tsx
import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-2">404 - Recipe Not Found</h1>
      <p className="text-muted-foreground mb-4">
        The recipe you’re looking for doesn’t exist.
      </p>
      <Link to="/" className="text-primary underline">Back to Home</Link>
    </div>
  )
}
