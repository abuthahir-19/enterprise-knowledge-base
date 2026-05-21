import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import ArticlesListPage from './pages/articles/ArticlesListPage.jsx'
import ArticleDetailPage from './pages/articles/ArticleDetailPage.jsx'
import CreateArticlePage from './pages/articles/CreateArticlePage.jsx'
import EditArticlePage from './pages/articles/EditArticlePage.jsx'
import MyArticlesPage from './pages/articles/MyArticlesPage.jsx'
import ApprovalQueuePage from './pages/approvals/ApprovalQueuePage.jsx'
import SearchPage from './pages/search/SearchPage.jsx'
import CategoriesPage from './pages/categories/CategoriesPage.jsx'
import TagsPage from './pages/tags/TagsPage.jsx'
import UserManagementPage from './pages/users/UserManagementPage.jsx'
import AnalyticsPage from './pages/analytics/AnalyticsPage.jsx'
import ProfilePage from './pages/profile/ProfilePage.jsx'
import BookmarksPage from './pages/bookmarks/BookmarksPage.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/articles" element={<ArticlesListPage />} />
        <Route
          path="/articles/create"
          element={
            <ProtectedRoute roles={['author', 'admin']}>
              <CreateArticlePage />
            </ProtectedRoute>
          }
        />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />
        <Route path="/articles/:id/edit" element={<EditArticlePage />} />
        <Route path="/my-articles" element={<MyArticlesPage />} />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute roles={['reviewer', 'admin']}>
              <ApprovalQueuePage />
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/categories"
          element={
            <ProtectedRoute roles={['admin']}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/tags" element={<TagsPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
