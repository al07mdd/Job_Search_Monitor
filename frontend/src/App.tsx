import { useEffect, useState } from 'react';
import { api } from './services/api';
import { VacancyStage } from './types';
import type { Vacancy, VacancyCreate } from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DashboardView } from './components/DashboardView';
import { AddVacancyModal } from './components/AddVacancyModal';
import { VacancyDetailsModal } from './components/VacancyDetailsModal';
import { SettingsView } from './components/settings/SettingsView';
import { useSettings } from './contexts/SettingsContext';
import { Plus, LayoutDashboard, BarChart3, Settings, Menu, ChevronLeft, Search, X, PieChart } from 'lucide-react';

function App() {
  const { theme } = useSettings();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [view, setView] = useState<'board' | 'analytics' | 'settings' | 'dashboard'>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const data = await api.getVacancies();
      setVacancies(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter vacancies
  const filteredVacancies = vacancies.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.company.toLowerCase().includes(q) ||
      v.position.toLowerCase().includes(q) ||
      (v.location && v.location.toLowerCase().includes(q))
    );
  });

  const handleStageChange = async (id: string, stage: VacancyStage) => {
    // Optimistic update
    setVacancies(prev => prev.map(v => v.id === id ? { ...v, stage } : v));
    try {
      await api.updateStage(id, stage);
    } catch (e) {
      console.error(e);
      loadVacancies(); // Revert on error
    }
  };

  const handleCreateVacancy = async (data: VacancyCreate) => {
    await api.createVacancy(data);
    loadVacancies();
  };

  const handleUpdateVacancy = async (data: VacancyCreate) => {
    if (!editingVacancy) return;
    await api.updateVacancy(editingVacancy.id, data);
    loadVacancies();
    setEditingVacancy(null);
    setShowAddModal(false);
  };

  // Sync state after inline updates (e.g. notes)
  const handleVacancyUpdateSync = (updated: Vacancy) => {
    setVacancies(prev => prev.map(v => v.id === updated.id ? updated : v));
    if (selectedVacancy && selectedVacancy.id === updated.id) {
      setSelectedVacancy(updated);
    }
  };

  const handleDeleteVacancy = async (id: string) => {
    if (confirm('Are you sure you want to delete this vacancy?')) {
      await api.deleteVacancy(id);
      loadVacancies();
      setSelectedVacancy(null);
    }
  };

  const openEditModal = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy);
    setSelectedVacancy(null);
    setShowAddModal(true);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen transition-colors duration-300 ${isDark ? "bg-[url('/bg-mesh.png')] bg-cover bg-no-repeat bg-fixed" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} duration-300 transition-all border-r-0 z-10 flex flex-col ${isDark ? 'glass-panel text-white' : 'bg-white border-r border-gray-200 text-gray-800'}`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 whitespace-nowrap overflow-hidden">
              JobTracker
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} ${!isSidebarOpen && 'mx-auto'}`}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          <button
            onClick={() => setView('dashboard')}
            title="Dashboard"
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'dashboard'
                ? (isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600')
                : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
              } ${!isSidebarOpen && 'justify-center'}`}
          >
            <PieChart size={20} className={isSidebarOpen ? "mr-3" : ""} />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => setView('board')}
            title="Board"
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'board'
                ? (isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600')
                : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
              } ${!isSidebarOpen && 'justify-center'}`}
          >
            <LayoutDashboard size={20} className={isSidebarOpen ? "mr-3" : ""} />
            {isSidebarOpen && <span>Board</span>}
          </button>

          <button
            onClick={() => setView('analytics')}
            title="Analytics"
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${view === 'analytics'
                ? (isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-600')
                : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
              } ${!isSidebarOpen && 'justify-center'}`}
          >
            <BarChart3 size={20} className={isSidebarOpen ? "mr-3" : ""} />
            {isSidebarOpen && <span>Analytics</span>}
          </button>
        </nav>

        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <button
            onClick={() => setView('settings')}
            title="Settings"
            className={`flex items-center w-full p-2 rounded-lg transition-colors ${view === 'settings'
                ? (isDark ? 'text-white bg-white/10' : 'text-blue-600 bg-blue-50')
                : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')
              } ${!isSidebarOpen && 'justify-center'}`}
          >
            <Settings size={20} className={isSidebarOpen ? "mr-2" : ""} />
            {isSidebarOpen && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        {isDark && <div className="absolute inset-0 bg-[#0a0a0e]/90 -z-10" />}

        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-8 backdrop-blur-sm border-b ${isDark ? 'border-white/10 text-white' : 'border-gray-200 bg-white/80 text-gray-900'
          }`}>
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium">
              {view === 'board' ? 'My Vacancies' : view === 'analytics' ? 'Analytics & Reports' : view === 'dashboard' ? 'Overview' : 'Settings'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search vacancies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-3 pr-8 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${isDark
                      ? 'bg-white/10 border-white/20 text-white focus:ring-blue-500 placeholder-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-900 focus:ring-blue-500 placeholder-gray-500'
                    }`}
                  autoFocus={isSearchOpen}
                />
                <button
                  onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Search Toggle Button */}
            {!isSearchOpen && view === 'board' && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
              >
                <Search size={20} />
              </button>
            )}

            {view !== 'settings' && (
              <button
                onClick={() => {
                  setEditingVacancy(null);
                  setShowAddModal(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                {isSidebarOpen && "Add Vacancy"}
              </button>
            )}
          </div>
        </header>

        {/* View Area */}
        <div className="flex-1 overflow-hidden p-6">
          {view === 'dashboard' && (
            <DashboardView
              vacancies={filteredVacancies}
              onNavigate={(v) => setSelectedVacancy(v)}
            />
          )}
          {view === 'board' && (
            <KanbanBoard
              vacancies={filteredVacancies}
              onVacancyClick={setSelectedVacancy}
              onDrop={handleStageChange}
            />
          )}
          {view === 'analytics' && (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <AnalyticsDashboard />
            </div>
          )}
          {view === 'settings' && (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <SettingsView />
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddVacancyModal
          onClose={() => setShowAddModal(false)}
          onSubmit={editingVacancy ? handleUpdateVacancy : handleCreateVacancy}
          initialData={editingVacancy || undefined}
        />
      )}

      {selectedVacancy && (
        <VacancyDetailsModal
          vacancy={selectedVacancy}
          onClose={() => setSelectedVacancy(null)}
          onDelete={handleDeleteVacancy}
          onEdit={openEditModal}
          onStatusChange={handleStageChange}
          onUpdate={handleVacancyUpdateSync}
        />
      )}
    </div>
  );
}

export default App;
