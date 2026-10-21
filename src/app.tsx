import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import TaskManagerPage from "@/pages/TaskManagerPage/TaskManagerPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TaskManagerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
