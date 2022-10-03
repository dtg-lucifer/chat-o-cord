import { Routes, Route } from "react-router-dom";
import LogInPage from "./pages/Auth/LogInPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ConversationChannelPage from "./pages/conversation/ConversationChannelPage";
import ConversationPage from "./pages/conversation/ConversationPage";
import GetStartedPage from "./pages/GetStartedPage";
import HomePage from "./pages/HomePage";
import PageNotFound from "./pages/_PageNotFound";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<GetStartedPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/auth">
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LogInPage />} />
        </Route>
        <Route path="/conversations" element={<ConversationPage />}>
          <Route path=":id" element={<ConversationChannelPage />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

export default App;
