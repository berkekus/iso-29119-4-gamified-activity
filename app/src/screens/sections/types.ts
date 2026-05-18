export interface SectionProps {
  isActive: boolean
  isCompleted: boolean
  onAdvance: () => void
  onNavigateOut?: (screen: any) => void
}
