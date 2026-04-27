import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import Projects from "./pages/Projects";
import TableGen from "./pages/TableGen";
import LayoutGen from "./pages/LayoutGen";
import PptGen from "./pages/PptGen";
import MainLayout from "./components/MainLayout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={Projects} />
      <Route path="/editor" component={Editor} />
      <Route path="/editor/:id" component={Editor} />
      <Route path="/table" component={TableGen} />
      <Route path="/layout" component={LayoutGen} />
      <Route path="/ppt" component={PptGen} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <MainLayout>
            <Router />
          </MainLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
