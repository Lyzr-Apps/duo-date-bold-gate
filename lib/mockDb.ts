// Temporary in-memory database for testing
// Replace with real Prisma DB when ready

export interface UserProfile {
  id: string
  email: string
  name: string
  age: number
  gender: string
  location: string
  occupation: string | null
  bio: string | null
  interests: string[]
  lookingFor: string
  dealBreakers: string[]
  idealDateType: string[]
  photos: string[]
  preferredGender: string[]
  preferredAgeMin: number
  preferredAgeMax: number
  onboardingComplete: boolean
  lastMatchDate: Date | null
  matchesShownToday: number
  createdAt: Date
  updatedAt: Date
}

export interface Match {
  id: string
  userId: string
  matchedUserId: string
  status: string
  userLiked: boolean | null
  matchedUserLiked: boolean | null
  compatibilityScore: number
  matchReason: string
  isMutualMatch: boolean
  chatUnlockedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: Date
}

// In-memory storage
const users = new Map<string, UserProfile>()
const usersByEmail = new Map<string, UserProfile>()
const matches = new Map<string, Match>()
const messages = new Map<string, Message>()

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Mock Prisma client
export const mockPrisma = {
  userProfile: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id) {
        return users.get(where.id) || null
      }
      if (where.email) {
        return usersByEmail.get(where.email) || null
      }
      return null
    },

    findMany: async ({ where, take }: any) => {
      const allUsers = Array.from(users.values())
      let filtered = allUsers

      if (where?.id?.notIn) {
        filtered = filtered.filter(u => !where.id.notIn.includes(u.id))
      }
      if (where?.onboardingComplete !== undefined) {
        filtered = filtered.filter(u => u.onboardingComplete === where.onboardingComplete)
      }
      if (where?.age?.gte) {
        filtered = filtered.filter(u => u.age >= where.age.gte)
      }
      if (where?.age?.lte) {
        filtered = filtered.filter(u => u.age <= where.age.lte)
      }

      if (take) {
        filtered = filtered.slice(0, take)
      }

      return filtered
    },

    create: async ({ data }: { data: any }) => {
      const id = generateId()
      const user: UserProfile = {
        id,
        email: data.email,
        name: data.name,
        age: data.age,
        gender: data.gender,
        location: data.location,
        occupation: data.occupation || null,
        bio: data.bio || null,
        interests: data.interests || [],
        lookingFor: data.lookingFor || '',
        dealBreakers: data.dealBreakers || [],
        idealDateType: data.idealDateType || [],
        photos: data.photos || [],
        preferredGender: data.preferredGender || [],
        preferredAgeMin: data.preferredAgeMin || 18,
        preferredAgeMax: data.preferredAgeMax || 99,
        onboardingComplete: data.onboardingComplete || false,
        lastMatchDate: data.lastMatchDate || null,
        matchesShownToday: data.matchesShownToday || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      users.set(id, user)
      usersByEmail.set(user.email, user)
      return user
    },

    upsert: async ({ where, create, update }: any) => {
      const existing = where.email ? usersByEmail.get(where.email) : null

      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date() }
        users.set(existing.id, updated)
        usersByEmail.set(existing.email, updated)
        return updated
      }

      return mockPrisma.userProfile.create({ data: create })
    },

    update: async ({ where, data }: any) => {
      const user = users.get(where.id)
      if (!user) throw new Error('User not found')

      const updated = { ...user, ...data, updatedAt: new Date() }
      users.set(where.id, updated)
      usersByEmail.set(updated.email, updated)
      return updated
    },
  },

  match: {
    findFirst: async ({ where, include }: any) => {
      const allMatches = Array.from(matches.values())
      const match = allMatches.find(m => {
        if (where.userId && m.userId !== where.userId) return false
        if (where.createdAt?.gte && m.createdAt < where.createdAt.gte) return false
        return true
      })

      if (!match) return null

      if (include?.matchedUser) {
        const matchedUser = users.get(match.matchedUserId)
        return { ...match, matchedUser }
      }

      return match
    },

    findMany: async ({ where, select }: any) => {
      const allMatches = Array.from(matches.values())
      const filtered = allMatches.filter(m => {
        if (where?.userId && m.userId !== where.userId) return false
        if (where?.isMutualMatch !== undefined && m.isMutualMatch !== where.isMutualMatch) return false
        return true
      })

      if (select?.matchedUserId) {
        return filtered.map(m => ({ matchedUserId: m.matchedUserId }))
      }

      return filtered
    },

    create: async ({ data, include }: any) => {
      const id = generateId()
      const match: Match = {
        id,
        userId: data.userId,
        matchedUserId: data.matchedUserId,
        status: data.status || 'pending',
        userLiked: data.userLiked ?? null,
        matchedUserLiked: data.matchedUserLiked ?? null,
        compatibilityScore: data.compatibilityScore,
        matchReason: data.matchReason,
        isMutualMatch: data.isMutualMatch || false,
        chatUnlockedAt: data.chatUnlockedAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      matches.set(id, match)

      if (include?.matchedUser) {
        const matchedUser = users.get(match.matchedUserId)
        return { ...match, matchedUser }
      }

      return match
    },

    update: async ({ where, data, include }: any) => {
      const match = matches.get(where.id)
      if (!match) throw new Error('Match not found')

      const updated = { ...match, ...data, updatedAt: new Date() }
      matches.set(where.id, updated)

      if (include?.matchedUser) {
        const matchedUser = users.get(updated.matchedUserId)
        return { ...updated, matchedUser }
      }

      return updated
    },
  },

  message: {
    findMany: async ({ where, include, orderBy }: any) => {
      const allMessages = Array.from(messages.values())
      let filtered = allMessages.filter(m => {
        if (where?.matchId && m.matchId !== where.matchId) return false
        return true
      })

      if (orderBy?.createdAt === 'asc') {
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      }

      if (include?.sender) {
        return filtered.map(m => ({
          ...m,
          sender: users.get(m.senderId),
        }))
      }

      return filtered
    },

    create: async ({ data }: any) => {
      const id = generateId()
      const message: Message = {
        id,
        matchId: data.matchId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        read: data.read || false,
        createdAt: new Date(),
      }
      messages.set(id, message)

      const sender = users.get(message.senderId)
      return { ...message, sender }
    },
  },
}

// Pre-populate with some test users
const testUsers = [
  {
    email: 'test1@doublemate.app',
    name: 'Sarah',
    age: 28,
    gender: 'Female',
    location: 'San Francisco, CA',
    occupation: 'Product Designer',
    interests: ['Hiking', 'Coffee', 'Art Galleries', 'Yoga'],
    lookingFor: 'Someone creative and adventurous',
    dealBreakers: ['Smoking'],
    idealDateType: ['Coffee Date', 'Museum Visit', 'Hiking'],
    preferredGender: ['Male'],
    preferredAgeMin: 25,
    preferredAgeMax: 35,
    onboardingComplete: true,
  },
  {
    email: 'test2@doublemate.app',
    name: 'Michael',
    age: 30,
    gender: 'Male',
    location: 'San Francisco, CA',
    occupation: 'Software Engineer',
    interests: ['Craft Beer', 'Live Music', 'Hiking', 'Cooking'],
    lookingFor: 'Someone genuine and fun-loving',
    dealBreakers: ['Drama'],
    idealDateType: ['Dinner', 'Concert', 'Hiking'],
    preferredGender: ['Female'],
    preferredAgeMin: 24,
    preferredAgeMax: 32,
    onboardingComplete: true,
  },
  {
    email: 'test3@doublemate.app',
    name: 'Emma',
    age: 26,
    gender: 'Female',
    location: 'Oakland, CA',
    occupation: 'Teacher',
    interests: ['Reading', 'Yoga', 'Wine Tasting', 'Travel'],
    lookingFor: 'Someone kind and intellectually curious',
    dealBreakers: ['Close-mindedness'],
    idealDateType: ['Wine Bar', 'Bookstore', 'Coffee Date'],
    preferredGender: ['Male'],
    preferredAgeMin: 26,
    preferredAgeMax: 34,
    onboardingComplete: true,
  },
]

// Initialize test users
testUsers.forEach(user => {
  mockPrisma.userProfile.create({ data: user })
})
