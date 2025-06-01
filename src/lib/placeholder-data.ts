import type { Issue, Proposal, User, Department, ChatMessage, Notification, KPIData, IssueStatus } from '@/types';
import { subDays, formatISO } from 'date-fns';

export const mockUsers: User[] = [
  { id: 'user1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'citizen', avatarUrl: 'https://placehold.co/100x100.png?text=AW' },
  { id: 'user2', name: 'Bob The Builder', email: 'bob@example.com', role: 'official', avatarUrl: 'https://placehold.co/100x100.png?text=BB' },
  { id: 'user3', name: 'Charlie Admin', email: 'charlie@example.com', role: 'admin', avatarUrl: 'https://placehold.co/100x100.png?text=CA' },
  { id: 'user4', name: 'Diana Prince', email: 'diana@example.com', role: 'citizen', avatarUrl: 'https://placehold.co/100x100.png?text=DP' },
];

export const mockDepartments: Department[] = [
  { id: 'dept1', name: 'Public Works', head: 'user2' },
  { id: 'dept2', name: 'Parks & Recreation' },
  { id: 'dept3', name: 'Transportation' },
];

const issueCategories = ["Pothole", "Streetlight Out", "Fallen Tree", "Graffiti", "Waste Management", "Water Leak"];
const issueStatuses: IssueStatus[] = ["Pending", "Assigned", "In Progress", "Resolved", "Closed"];

export const mockIssues: Issue[] = Array.from({ length: 20 }, (_, i) => ({
  id: `issue${i + 1}`,
  title: `${issueCategories[i % issueCategories.length]} on Main St ${i+1}`,
  description: `A ${issueCategories[i % issueCategories.length].toLowerCase()} has been reported near 123 Main St. It requires immediate attention. This is a detailed description of the issue. It seems to be causing some inconvenience to the local residents and potentially poses a safety hazard if not addressed promptly.`,
  category: issueCategories[i % issueCategories.length],
  status: issueStatuses[i % issueStatuses.length],
  location: { 
    lat: 34.0522 + (Math.random() - 0.5) * 0.1, 
    lng: -118.2437 + (Math.random() - 0.5) * 0.1,
    address: `${100 + i} Main St, Anytown, USA`
  },
  reportedBy: mockUsers[i % mockUsers.length].id,
  assignedTo: mockDepartments[i % mockDepartments.length].id,
  createdAt: formatISO(subDays(new Date(), i * 2 + 1)),
  updatedAt: formatISO(subDays(new Date(), i)),
  media: i % 3 === 0 ? [{ url: `https://placehold.co/600x400.png?text=Issue+${i+1}`, type: 'image' as 'image' | 'video' }] : [],
  severity: (['low', 'medium', 'high'] as ('low' | 'medium' | 'high')[])[i % 3],
}));

export const mockProposals: Proposal[] = [
  {
    id: 'prop1',
    title: 'New Community Park on Elm Street',
    description: 'Proposal to convert the vacant lot on Elm Street into a community park with a playground and green space.',
    createdBy: 'user3',
    createdAt: formatISO(subDays(new Date(), 10)),
    votingDeadline: formatISO(subDays(new Date(), -20)), // 20 days from now
    options: [
      { id: 'opt1_1', text: 'Yes, build the park', votes: 152 },
      { id: 'opt1_2', text: 'No, use lot for something else', votes: 34 },
      { id: 'opt1_3', text: 'Need more information', votes: 12 },
    ],
    totalVotes: 198,
    media: [{ url: 'https://placehold.co/600x400.png?text=Park+Proposal', type: 'image' }],
  },
  {
    id: 'prop2',
    title: 'Increase Bike Lanes Downtown',
    description: 'A proposal to add dedicated bike lanes on major downtown streets to promote cycling and reduce traffic.',
    createdBy: 'user3',
    createdAt: formatISO(subDays(new Date(), 5)),
    votingDeadline: formatISO(subDays(new Date(), -15)), // 15 days from now
    options: [
      { id: 'opt2_1', text: 'Strongly Agree', votes: 250 },
      { id: 'opt2_2', text: 'Agree', votes: 120 },
      { id: 'opt2_3', text: 'Neutral', votes: 45 },
      { id: 'opt2_4', text: 'Disagree', votes: 30 },
      { id: 'opt2_5', text: 'Strongly Disagree', votes: 15 },
    ],
    totalVotes: 460,
  },
];

export const mockChatMessages: ChatMessage[] = [
  { id: 'msg1', senderId: 'user1', receiverId: 'user2', content: 'Hello, I reported an issue about a pothole.', timestamp: formatISO(subDays(new Date(), 1))},
  { id: 'msg2', senderId: 'user2', receiverId: 'user1', content: 'Hi Alice, thanks for reporting. We are looking into it.', timestamp: formatISO(subDays(new Date(), 0))},
  { id: 'msg3', senderId: 'user4', groupId: 'group1', content: 'Anyone else notice the new park proposal?', timestamp: formatISO(subDays(new Date(), 0))},
];

export const mockNotifications: Notification[] = [
  { id: 'notif1', userId: 'user1', message: 'Your reported issue "Pothole on Main St" has been updated to "Assigned".', type: 'issue_update', link: '/issues/issue1', isRead: false, createdAt: formatISO(new Date()) },
  { id: 'notif2', userId: 'user1', message: 'A new proposal "New Community Park" is open for voting.', type: 'new_proposal', link: '/polling/prop1', isRead: true, createdAt: formatISO(subDays(new Date(), 1)) },
];

export const mockKpis: KPIData[] = [
  { label: 'Total Issues Reported', value: mockIssues.length, previousValue: 18, unit: 'issues', change: ((mockIssues.length-18)/18)*100 },
  { label: 'Average Resolution Time', value: 5.2, previousValue: 5.8, unit: 'days', change: ((5.2-5.8)/5.8)*100 },
  { label: 'Citizen Engagement', value: 75, previousValue: 70, unit: '% active users', change: ((75-70)/70)*100 },
  { label: 'Proposals Voted On', value: mockProposals.reduce((sum, p) => sum + p.totalVotes, 0), previousValue: 500, unit: 'votes', change: ((mockProposals.reduce((sum, p) => sum + p.totalVotes, 0)-500)/500)*100 },
];

export const mockDepartmentPerformance = [
  { name: 'Public Works', issuesResolved: 35, avgResponseTime: 2.5, citizenRating: 4.2 },
  { name: 'Parks & Rec', issuesResolved: 22, avgResponseTime: 3.1, citizenRating: 4.5 },
  { name: 'Transportation', issuesResolved: 41, avgResponseTime: 1.8, citizenRating: 3.9 },
];
