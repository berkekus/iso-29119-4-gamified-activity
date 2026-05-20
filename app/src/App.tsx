import GraphPaperBg from './ui/GraphPaperBg'
import { useGameStore } from './stores/gameStore'

import MainMenuScreen      from './screens/MainMenuScreen'
import CampaignMapScreen   from './screens/CampaignMapScreen'
import CasePlayScreen      from './screens/CasePlayScreen'
import DesignSystemScreen  from './screens/DesignSystemScreen'
import HowToPlayScreen     from './screens/HowToPlayScreen'
import LawLibraryScreen    from './screens/LawLibraryScreen'
import AchievementsScreen     from './screens/AchievementsScreen'
import SpeedTrialLobbyScreen  from './screens/SpeedTrialLobbyScreen'
import SpeedTrialHostScreen   from './screens/SpeedTrialHostScreen'
import SpeedTrialPlayerScreen from './screens/SpeedTrialPlayerScreen'
import SpeedTrialWinnerScreen from './screens/SpeedTrialWinnerScreen'
import MockTrialLobbyScreen from './screens/MockTrialLobbyScreen'
import MockTrialCourtSelectionScreen from './screens/MockTrialCourtSelectionScreen'
import MockTrialHostScreen from './screens/MockTrialHostScreen'
import MockTrialCaseScreen from './screens/MockTrialCaseScreen'
import MockTrialRevealScreen from './screens/MockTrialRevealScreen'
import MockTrialFinalScreen from './screens/MockTrialFinalScreen'

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
    switch (screen) {
      case 'menu':
        return <MainMenuScreen onNavigate={navigate} />
      case 'campaign':
        return <CampaignMapScreen onNavigate={navigate} onBack={goBack} completedCases={completedCases} onSelectCase={handleSelectCase} />
      case 'play':
        return <CasePlayScreen onNavigateOut={navigate} />
      case 'design-system':
        return <DesignSystemScreen onBack={goBack} />
      case 'how-to-play':
        return <HowToPlayScreen onBack={goBack} />
      case 'law-library':
        return <LawLibraryScreen onBack={goBack} />
      case 'achievements':
        return <AchievementsScreen onBack={goBack} />
      case 'speed-trial-lobby':
        return <SpeedTrialLobbyScreen onNavigate={navigate} onBack={goBack} />
      case 'speed-trial-host':
        return <SpeedTrialHostScreen onNavigate={navigate} onBack={goBack} />
      case 'speed-trial-player':
        return <SpeedTrialPlayerScreen onNavigate={navigate} onBack={goBack} />
      case 'speed-trial-winner':
        return <SpeedTrialWinnerScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-lobby':
        return <MockTrialLobbyScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-court-select':
        return <MockTrialCourtSelectionScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-host':
        return <MockTrialHostScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-case':
        return <MockTrialCaseScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-reveal':
        return <MockTrialRevealScreen onNavigate={navigate} onBack={goBack} />
      case 'mock-trial-final':
        return <MockTrialFinalScreen onNavigate={navigate} onBack={goBack} />
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
