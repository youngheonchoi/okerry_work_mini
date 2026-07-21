import { format } from 'date-fns'
import { getJournal } from '@/app/actions/journal'
import JournalFlow from '@/components/journal/JournalFlow'

export default async function JournalPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const initialEntries = await getJournal(today)

  return <JournalFlow today={today} initialDate={today} initialEntries={initialEntries} />
}
