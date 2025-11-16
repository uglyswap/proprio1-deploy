import { useOrganization } from './use-organization'

export function useCredits() {
  const { organization, refreshOrganization } = useOrganization()

  return {
    credits: organization?.creditBalance ?? 0,
    plan: organization?.plan ?? 'FREE',
    refresh: refreshOrganization,
  }
}
