import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/layout/Sidebar";
import { studies } from "./data/demoData";
import CreateStudyPage from "./pages/CreateStudyPage";
import GenericPage from "./pages/GenericPage";
import HomePage from "./pages/HomePage";
import ReportPage from "./pages/ReportPage";
import StudiesPage from "./pages/StudiesPage";

export default function App() {
  const [page, setPage] = useState("home");
  const [study, setStudy] = useState(studies[0]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);

  const goReport = (selectedStudy) => {
    setStudy(selectedStudy);
    setPage("report");
  };

  const changePage = (nextPage) => {
    setPage(nextPage);
    setMobile(false);
  };

  const views = {
    home: <HomePage goReport={goReport} setPage={setPage} />,
    studies: <StudiesPage goReport={goReport} setPage={setPage} />,
    report: <ReportPage study={study} setPage={setPage} />,
    create: <CreateStudyPage setPage={setPage} finish={goReport} />,
  };

  return (
    <div
      className={`shell ${collapsed ? "collapsed" : ""} ${mobile ? "mobile-open" : ""}`}
    >
      <Sidebar
        page={page}
        setPage={changePage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <button
        className="global-mobile icon-btn"
        onClick={() => setMobile(true)}
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>
      <div className="overlay" onClick={() => setMobile(false)} />
      <section className="main">
        {views[page] ?? <GenericPage type={page} />}
      </section>
    </div>
  );
}
