import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { CoursePage } from './pages/CoursePage'
import { FormateurPage } from './pages/FormateurPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ParcoursPage } from './pages/ParcoursPage'
import { ResourcesPage } from './pages/ResourcesPage'
import '@fontsource-variable/dm-sans'
import './styles/app.css'
import './styles/highlight.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="parcours" element={<ParcoursPage />} />
          <Route path="cours/*" element={<CoursePage />} />
          <Route path="ressources" element={<ResourcesPage />} />
          <Route path="formateur" element={<FormateurPage />} />
          {/* Formation « Vue → PHP · Symfony » : mêmes pages, préfixées par /vue */}
          <Route path="vue">
            <Route index element={<HomePage />} />
            <Route path="parcours" element={<ParcoursPage />} />
            <Route path="cours/*" element={<CoursePage />} />
            <Route path="ressources" element={<ResourcesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
