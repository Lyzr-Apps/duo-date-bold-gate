'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { callAIAgent } from '@/lib/aiAgent'
import {
  FaHeart,
  FaTimes,
  FaStar,
  FaCompass,
  FaComments,
  FaCalendarAlt,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaTrash,
  FaMapMarkerAlt,
  FaDollarSign,
  FaUtensils,
  FaCocktail,
  FaRunning,
  FaTree,
  FaCamera,
  FaPaperPlane,
  FaMusic,
  FaFilm,
  FaBook,
  FaPalette,
  FaGamepad,
  FaCoffee,
  FaSearch,
  FaCheck,
  FaFilter
} from 'react-icons/fa'
import { Loader2 } from 'lucide-react'

// TypeScript Interfaces based on actual agent response
interface VenueRecommendation {
  venue_name: string
  venue_type: string
  address: string
  why_suggested: string
  estimated_cost_per_person: string
  suitability_score: string
  highlights: string[]
}

interface VenueRecommendationResult {
  recommendations: VenueRecommendation[]
  total_recommendations: number
}

interface AgentResponse {
  status: string
  result: VenueRecommendationResult
  metadata?: {
    agent_name: string
    timestamp: string
  }
}

// Demo Data Types
interface Person {
  name: string
  age: number
  occupation: string
  bio: string
}

interface JointProfile {
  person1: Person
  person2: Person
  photos: string[]
  sharedBio: string
  interests: string[]
  preferences: {
    ageRange: [number, number]
    distance: number
    lookingFor: string[]
  }
}

interface Match {
  id: string
  pair: {
    person1: Person
    person2: Person
    photos: string[]
    bio: string
  }
  matchDate: string
  lastMessage?: {
    sender: string
    text: string
    time: string
  }
}

interface Message {
  id: string
  sender: 'person1' | 'person2' | 'them1' | 'them2'
  senderName: string
  text: string
  time: string
}

type Screen = 'discover' | 'matches' | 'chat' | 'planDate' | 'profile'
type ProfileStep = 'photos' | 'bio' | 'interests' | 'details' | 'preferences'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('discover')
  const [profileStep, setProfileStep] = useState<ProfileStep>('photos')

  // Profile Creation State
  const [profile, setProfile] = useState<JointProfile>({
    person1: { name: '', age: 0, occupation: '', bio: '' },
    person2: { name: '', age: 0, occupation: '', bio: '' },
    photos: [],
    sharedBio: '',
    interests: [],
    preferences: {
      ageRange: [22, 35],
      distance: 25,
      lookingFor: []
    }
  })

  // Discover State
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [interestedIn, setInterestedIn] = useState<string[]>([])

  // Matches State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [messageText, setMessageText] = useState('')

  // Date Planning State
  const [location, setLocation] = useState('')
  const [activityTypes, setActivityTypes] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState<[number, number]>([30, 50])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [recommendations, setRecommendations] = useState<VenueRecommendation[]>([])

  // Demo data
  const demoProfiles = [
    {
      id: '1',
      person1: { name: 'Sarah', age: 28, occupation: 'Designer', bio: 'Art lover and coffee enthusiast' },
      person2: { name: 'Mike', age: 29, occupation: 'Engineer', bio: 'Hiking and craft beer fan' },
      photos: ['/api/placeholder/400/500', '/api/placeholder/400/500'],
      bio: 'We love exploring new places and trying different cuisines. Weekend adventurers looking for fun couples to hang out with!',
      interests: ['Hiking', 'Art', 'Coffee', 'Craft Beer', 'Live Music']
    },
    {
      id: '2',
      person1: { name: 'Emma', age: 26, occupation: 'Teacher', bio: 'Book nerd and foodie' },
      person2: { name: 'Jake', age: 27, occupation: 'Marketing', bio: 'Fitness and film buff' },
      photos: ['/api/placeholder/400/500', '/api/placeholder/400/500'],
      bio: 'Foodies at heart! We enjoy fine dining, indie films, and Sunday morning farmers markets.',
      interests: ['Fine Dining', 'Films', 'Books', 'Fitness', 'Farmers Markets']
    }
  ]

  const demoMatches: Match[] = [
    {
      id: '1',
      pair: demoProfiles[0],
      matchDate: '2026-02-05',
      lastMessage: {
        sender: 'Sarah',
        text: 'That sounds amazing! We are free on Saturday.',
        time: '10:30 AM'
      }
    }
  ]

  const demoMessages: Message[] = [
    { id: '1', sender: 'them1', senderName: 'Sarah', text: 'Hey! We love your profile!', time: '9:15 AM' },
    { id: '2', sender: 'person1', senderName: 'Emma', text: 'Thanks! You two seem awesome too!', time: '9:20 AM' },
    { id: '3', sender: 'them2', senderName: 'Mike', text: 'Want to plan a double date this weekend?', time: '9:45 AM' },
    { id: '4', sender: 'person2', senderName: 'Jake', text: 'That sounds amazing! We are free on Saturday.', time: '10:30 AM' }
  ]

  const availableInterests = [
    { icon: FaUtensils, label: 'Dining' },
    { icon: FaCocktail, label: 'Cocktails' },
    { icon: FaMusic, label: 'Music' },
    { icon: FaFilm, label: 'Films' },
    { icon: FaBook, label: 'Books' },
    { icon: FaPalette, label: 'Art' },
    { icon: FaRunning, label: 'Fitness' },
    { icon: FaTree, label: 'Outdoors' },
    { icon: FaGamepad, label: 'Gaming' },
    { icon: FaCoffee, label: 'Coffee' }
  ]

  // Handlers
  const handleSwipe = (direction: 'left' | 'right' | 'super') => {
    if (direction === 'right' || direction === 'super') {
      // Match logic here
    }
    setCurrentCardIndex(prev => prev + 1)
    setInterestedIn([])
  }

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const toggleActivityType = (type: string) => {
    setActivityTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const sendMessage = () => {
    if (!messageText.trim()) return
    // Send message logic
    setMessageText('')
  }

  const getVenueRecommendations = async () => {
    setLoadingRecommendations(true)

    const message = `We need venue recommendations for a double date in ${location || 'San Francisco'}.
    Pair 1 (Emma & Jake): interests include ${profile.interests.slice(0, 3).join(', ')}.
    Pair 2 (Sarah & Mike): interests include craft beer, live music, outdoor activities.
    Budget: $${budgetRange[0]}-${budgetRange[1]} per person.
    ${activityTypes.length > 0 ? `Activity types: ${activityTypes.join(', ')}.` : ''}
    Looking for something fun and social for this weekend.`

    try {
      const result = await callAIAgent(message, '69877e88516690c4422a963e')

      if (result.success && result.response.status === 'success') {
        const agentResponse = result.response.result as VenueRecommendationResult
        setRecommendations(agentResponse.recommendations || [])
      }
    } catch (error) {
      console.error('Error getting recommendations:', error)
    } finally {
      setLoadingRecommendations(false)
    }
  }

  // Profile Creation Component
  const ProfileCreationWizard = () => (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="glass-card border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-primary">Create Your Joint Profile</CardTitle>
          <div className="flex justify-center gap-2 mt-4">
            {(['photos', 'bio', 'interests', 'details', 'preferences'] as ProfileStep[]).map((step, idx) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  profileStep === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profileStep === 'photos' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Add Photos (3+ recommended)</h3>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    <FaCamera className="text-muted-foreground text-2xl" />
                  </div>
                ))}
              </div>
              <Button onClick={() => setProfileStep('bio')} className="w-full mt-6">
                Next: Add Bios
              </Button>
            </div>
          )}

          {profileStep === 'bio' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Shared Bio</label>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2"
                  placeholder="Tell others about you two as a pair..."
                  value={profile.sharedBio}
                  onChange={(e) => setProfile(prev => ({ ...prev, sharedBio: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Person 1 Bio</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2"
                    placeholder="Individual bio..."
                    value={profile.person1.bio}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person1: { ...prev.person1, bio: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Person 2 Bio</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2"
                    placeholder="Individual bio..."
                    value={profile.person2.bio}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person2: { ...prev.person2, bio: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setProfileStep('photos')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setProfileStep('interests')} className="flex-1">
                  Next: Interests
                </Button>
              </div>
            </div>
          )}

          {profileStep === 'interests' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Your Interests</h3>
              <div className="grid grid-cols-3 gap-3">
                {availableInterests.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => toggleInterest(label)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      profile.interests.includes(label)
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/30'
                    }`}
                  >
                    <Icon className="mx-auto text-2xl mb-2" />
                    <div className="text-xs font-medium">{label}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setProfileStep('bio')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setProfileStep('details')} className="flex-1">
                  Next: Details
                </Button>
              </div>
            </div>
          )}

          {profileStep === 'details' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-primary">Person 1</h4>
                  <Input
                    placeholder="Name"
                    value={profile.person1.name}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person1: { ...prev.person1, name: e.target.value }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Age"
                    value={profile.person1.age || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person1: { ...prev.person1, age: parseInt(e.target.value) || 0 }
                    }))}
                  />
                  <Input
                    placeholder="Occupation"
                    value={profile.person1.occupation}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person1: { ...prev.person1, occupation: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-accent">Person 2</h4>
                  <Input
                    placeholder="Name"
                    value={profile.person2.name}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person2: { ...prev.person2, name: e.target.value }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Age"
                    value={profile.person2.age || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person2: { ...prev.person2, age: parseInt(e.target.value) || 0 }
                    }))}
                  />
                  <Input
                    placeholder="Occupation"
                    value={profile.person2.occupation}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person2: { ...prev.person2, occupation: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setProfileStep('interests')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setProfileStep('preferences')} className="flex-1">
                  Next: Preferences
                </Button>
              </div>
            </div>
          )}

          {profileStep === 'preferences' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Match Preferences</h3>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Age Range: {profile.preferences.ageRange[0]} - {profile.preferences.ageRange[1]}
                </label>
                <input
                  type="range"
                  min="18"
                  max="60"
                  value={profile.preferences.ageRange[1]}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      ageRange: [prev.preferences.ageRange[0], parseInt(e.target.value)]
                    }
                  }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Distance: {profile.preferences.distance} miles
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={profile.preferences.distance}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, distance: parseInt(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setProfileStep('details')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setCurrentScreen('discover')} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  Complete Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Discover Screen
  const DiscoverScreen = () => {
    const currentProfile = demoProfiles[currentCardIndex % demoProfiles.length]

    return (
      <div className="max-w-md mx-auto p-4 h-[calc(100vh-100px)] flex flex-col">
        <Card className="glass-card border-2 border-primary/20 flex-1 flex flex-col">
          <div className="relative flex-1">
            <div className="absolute inset-0 rounded-t-lg overflow-hidden">
              <img
                src={currentProfile.photos[0]}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <h3 className="text-2xl font-bold">{currentProfile.person1.name}, {currentProfile.person1.age}</h3>
                  <p className="text-sm opacity-90">{currentProfile.person1.occupation}</p>
                </div>
                <div className="text-white/80">+</div>
                <div>
                  <h3 className="text-2xl font-bold">{currentProfile.person2.name}, {currentProfile.person2.age}</h3>
                  <p className="text-sm opacity-90">{currentProfile.person2.occupation}</p>
                </div>
              </div>
              <p className="text-sm mb-3">{currentProfile.bio}</p>
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.map(interest => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="text-sm font-medium text-center mb-2">Interested In:</div>
            <div className="flex justify-center gap-2">
              <Button
                variant={interestedIn.includes('person1') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterestedIn(prev =>
                  prev.includes('person1') ? prev.filter(p => p !== 'person1') : [...prev, 'person1']
                )}
              >
                {currentProfile.person1.name}
              </Button>
              <Button
                variant={interestedIn.includes('person2') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterestedIn(prev =>
                  prev.includes('person2') ? prev.filter(p => p !== 'person2') : [...prev, 'person2']
                )}
              >
                {currentProfile.person2.name}
              </Button>
              <Button
                variant={interestedIn.includes('both') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterestedIn(prev =>
                  prev.includes('both') ? prev.filter(p => p !== 'both') : [...prev, 'both']
                )}
              >
                Both
              </Button>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 p-0"
                onClick={() => handleSwipe('left')}
              >
                <FaTimes className="text-2xl text-destructive" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 p-0 bg-primary"
                onClick={() => handleSwipe('right')}
              >
                <FaHeart className="text-2xl" />
              </Button>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 p-0 bg-accent"
                onClick={() => handleSwipe('super')}
              >
                <FaStar className="text-2xl" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Matches Screen
  const MatchesScreen = () => (
    <div className="max-w-6xl mx-auto p-4 grid md:grid-cols-2 gap-4 h-[calc(100vh-100px)]">
      <Card className="glass-card border-2 border-primary/20 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Your Matches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {demoMatches.map(match => (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`w-full p-4 hover:bg-muted/50 transition-colors text-left ${
                  selectedMatch?.id === match.id ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img
                      src={match.pair.photos[0]}
                      alt=""
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                    <img
                      src={match.pair.photos[1]}
                      alt=""
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {match.pair.person1.name} & {match.pair.person2.name}
                    </div>
                    {match.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {match.lastMessage.sender}: {match.lastMessage.text}
                      </p>
                    )}
                  </div>
                  {match.lastMessage && (
                    <div className="text-xs text-muted-foreground">{match.lastMessage.time}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-2 border-primary/20 flex flex-col">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedMatch
                ? `${selectedMatch.pair.person1.name} & ${selectedMatch.pair.person2.name}`
                : 'Select a match'}
            </CardTitle>
            {selectedMatch && (
              <Button size="sm" onClick={() => setCurrentScreen('planDate')}>
                <FaCalendarAlt className="mr-2" />
                Plan Date
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedMatch && demoMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender.startsWith('person') ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender.startsWith('person')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="text-xs font-medium mb-1">{msg.senderName}</div>
                <div className="text-sm">{msg.text}</div>
                <div className="text-xs opacity-70 mt-1">{msg.time}</div>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>
              <FaPaperPlane />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )

  // Plan Date Screen
  const PlanDateScreen = () => (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card className="glass-card border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Plan Your Perfect Double Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter city or location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Activity Types</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: FaUtensils, label: 'Dinner' },
                { icon: FaCocktail, label: 'Drinks' },
                { icon: FaRunning, label: 'Activities' },
                { icon: FaTree, label: 'Outdoor' }
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => toggleActivityType(label)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    activityTypes.includes(label)
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/30'
                  }`}
                >
                  <Icon className="mx-auto text-2xl mb-2" />
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              <FaDollarSign className="inline mr-1" />
              Budget Per Person: ${budgetRange[0]} - ${budgetRange[1]}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={budgetRange[0]}
                onChange={(e) => setBudgetRange([parseInt(e.target.value), budgetRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={budgetRange[1]}
                onChange={(e) => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          <Button
            onClick={getVenueRecommendations}
            disabled={loadingRecommendations}
            className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent"
          >
            {loadingRecommendations ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Finding Perfect Venues...
              </>
            ) : (
              <>
                <FaSearch className="mr-2" />
                Get Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">
            {recommendations.length} Recommendations Found
          </h3>
          {recommendations.map((venue, idx) => (
            <Card key={idx} className="glass-card border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-primary">{venue.venue_name}</h4>
                    <p className="text-sm text-muted-foreground">{venue.venue_type}</p>
                    <p className="text-sm flex items-center gap-1 mt-1">
                      <FaMapMarkerAlt className="text-accent" />
                      {venue.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <FaStar />
                      <span className="text-2xl">{venue.suitability_score}</span>
                      <span className="text-sm text-muted-foreground">/10</span>
                    </div>
                    <div className="text-lg font-semibold text-accent mt-1">
                      {venue.estimated_cost_per_person}
                      <span className="text-xs text-muted-foreground">/person</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm leading-relaxed">{venue.why_suggested}</p>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">Highlights:</div>
                  <div className="flex flex-wrap gap-2">
                    {venue.highlights.map((highlight, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20 flex items-center gap-1"
                      >
                        <FaCheck className="text-xs" />
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="outline">
                    View Details
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-primary to-accent">
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Profile Management Screen
  const ProfileScreen = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'preferences'>('profile')

    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="glass-card border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Profile Management</CardTitle>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant={activeTab === 'profile' ? 'default' : 'outline'}
                onClick={() => setActiveTab('profile')}
              >
                Our Profile
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'outline'}
                onClick={() => setActiveTab('settings')}
              >
                My Settings
              </Button>
              <Button
                variant={activeTab === 'preferences' ? 'default' : 'outline'}
                onClick={() => setActiveTab('preferences')}
              >
                Preferences
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Photo Gallery</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 cursor-pointer transition-colors relative group"
                      >
                        <FaCamera className="text-muted-foreground text-2xl" />
                        {i <= 2 && (
                          <button className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <FaTrash className="text-xs" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Shared Bio</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2"
                    placeholder="Tell others about you two..."
                    value={profile.sharedBio}
                    onChange={(e) => setProfile(prev => ({ ...prev, sharedBio: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Interests</label>
                  <div className="grid grid-cols-3 gap-3">
                    {availableInterests.map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        onClick={() => toggleInterest(label)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          profile.interests.includes(label)
                            ? 'border-primary bg-primary/10'
                            : 'border-muted hover:border-primary/30'
                        }`}
                      >
                        <Icon className="mx-auto text-xl mb-1" />
                        <div className="text-xs font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-accent">
                  Save Changes
                </Button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Name</label>
                    <Input value={profile.person1.name} onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person1: { ...prev.person1, name: e.target.value }
                    }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Age</label>
                    <Input type="number" value={profile.person1.age || ''} onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person1: { ...prev.person1, age: parseInt(e.target.value) || 0 }
                    }))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Occupation</label>
                  <Input value={profile.person1.occupation} onChange={(e) => setProfile(prev => ({
                    ...prev,
                    person1: { ...prev.person1, occupation: e.target.value }
                  }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Bio</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2"
                    value={profile.person1.bio}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      person1: { ...prev.person1, bio: e.target.value }
                    }))}
                  />
                </div>
                <Button className="w-full">Save Settings</Button>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Age Range: {profile.preferences.ageRange[0]} - {profile.preferences.ageRange[1]}
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={profile.preferences.ageRange[1]}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        ageRange: [prev.preferences.ageRange[0], parseInt(e.target.value)]
                      }
                    }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Maximum Distance: {profile.preferences.distance} miles
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={profile.preferences.distance}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, distance: parseInt(e.target.value) }
                    }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Looking For</label>
                  <div className="space-y-2">
                    {['New Friends', 'Activity Partners', 'Travel Buddies', 'Dining Companions'].map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={profile.preferences.lookingFor.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProfile(prev => ({
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  lookingFor: [...prev.preferences.lookingFor, option]
                                }
                              }))
                            } else {
                              setProfile(prev => ({
                                ...prev,
                                preferences: {
                                  ...prev.preferences,
                                  lookingFor: prev.preferences.lookingFor.filter(o => o !== option)
                                }
                              }))
                            }
                          }}
                          className="rounded border-input"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button className="w-full">Save Preferences</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Main Content */}
      <div className="pt-4">
        {currentScreen === 'discover' && <DiscoverScreen />}
        {currentScreen === 'matches' && <MatchesScreen />}
        {currentScreen === 'planDate' && <PlanDateScreen />}
        {currentScreen === 'profile' && <ProfileScreen />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 glass-card border-t-2 border-primary/20">
        <div className="max-w-md mx-auto flex justify-around py-3">
          <button
            onClick={() => setCurrentScreen('discover')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentScreen === 'discover' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <FaCompass className="text-2xl" />
            <span className="text-xs font-medium">Discover</span>
          </button>
          <button
            onClick={() => setCurrentScreen('matches')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentScreen === 'matches' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <FaHeart className="text-2xl" />
            <span className="text-xs font-medium">Matches</span>
          </button>
          <button
            onClick={() => setCurrentScreen('planDate')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentScreen === 'planDate' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <FaCalendarAlt className="text-2xl" />
            <span className="text-xs font-medium">Plan Date</span>
          </button>
          <button
            onClick={() => setCurrentScreen('profile')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              currentScreen === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <FaUser className="text-2xl" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}
