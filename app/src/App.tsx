import GraphPaperBg from './ui/GraphPaperBg'
import { useGameStore } from './stores/gameStore'

import MainMenuScreen      from './screens/MainMenuScreen'
import CampaignMapScreen   from './screens/CampaignMapScreen'
import CasePlayScreen      from './screens/CasePlayScreen'
import BriefingScreen      from './screens/BriefingScreen'
import InvestigationScreen from './screens/InvestigationScreen'
import EvidenceScreen      from './screens/EvidenceScreen'
import TrialScreen         from './screens/TrialScreen'
import DebriefScreen       from './screens/DebriefScreen'
import DesignSystemScreen  from './screens/DesignSystemScreen'
import HowToPlayScreen     from './screens/HowToPlayScreen'
import LawLibraryScreen    from './screens/LawLibraryScreen'
import AchievementsScreen  from './screens/AchievementsScreen'

export default function App() {
  const { screen, navigate, goBack, completedCases, loadCaseById } = useGameStore()

  const handleSelectCase = (caseId: string) => {
    try {
      loadCaseById(caseId)
    } catch (err) {
      console.error('[App] Failed to load case', caseId, err)
    }
  }

  const renderScreen = () => {
    const props = { onNavigate: navigate, onBack: goBack }
    switch (screen) {
      case 'menu':
        return <MainMenuScreen onNavigate={navigate} />
      case 'campaign':
        return <CampaignMapScreen {...props} completedCases={completedCases} onSelectCase={handleSelectCase} />
      case 'play':
        return <CasePlayScreen onNavigateOut={navigate} />
      case 'briefing':
        return <BriefingScreen {...props} />
      case 'investigation':
        return <InvestigationScreen {...props} />
      case 'evidence':
        return <EvidenceScreen {...props} />
      case 'trial':
        return <TrialScreen {...props} />
      case 'debrief':
        return <DebriefScreen {...props} />
      case 'design-system':
        return <DesignSystemScreen onBack={goBack} />
      case 'how-to-play':
        return <HowToPlayScreen onBack={goBack} />
      case 'law-library':
        return <LawLibraryScreen onBack={goBack} />
      case 'achievements':
        return <AchievementsScreen onBack={goBack} />
      default:
        return <MainMenuScreen onNavigate={navigate} />
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <GraphPaperBg />
      <div className="app-center">
        {renderScreen()}
      </div>
    </div>
  )
}
