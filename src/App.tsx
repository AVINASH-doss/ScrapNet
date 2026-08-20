import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPlaceholder />} />
    </Routes>
  )
}

function LandingPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <div className="text-center text-white animate-fade-in">
        <h1 className="text-5xl font-bold mb-4">♻️ ScrapNet</h1>
        <p className="text-xl text-brand-200">
          Turn your scrap into value. Find a trusted collector nearby.
        </p>
      </div>
    </div>
  )
}

export default App
