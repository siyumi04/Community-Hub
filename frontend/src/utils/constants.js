export const API_BASE_URL = 'http://localhost:5000/api';

export const COMMUNITY_FORM_FIELDS = {
  cricket: {
    uniqueFields: [
      {
        name: 'playingRole',
        label: 'Playing Role',
        type: 'dropdown',
        options: ['Batsman', 'Bowler', 'All-rounder', 'Wicket Keeper'],
      },
      {
        name: 'experienceLevel',
        label: 'Experience Level',
        type: 'dropdown',
        options: ['Beginner', 'Intermediate', 'Advanced'],
      },
      {
        name: 'ownEquipment',
        label: 'Do you own your own equipment?',
        type: 'radio',
        options: ['Yes', 'No'],
      },
    ],
  },
  hockey: {
    uniqueFields: [
      {
        name: 'playingPosition',
        label: 'Playing Position',
        type: 'dropdown',
        options: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
      },
      {
        name: 'experienceLevel',
        label: 'Experience Level',
        type: 'dropdown',
        options: ['Beginner', 'Intermediate', 'Advanced'],
      },
      {
        name: 'ownStick',
        label: 'Do you own your own stick?',
        type: 'radio',
        options: ['Yes', 'No'],
      },
    ],
  },
  environmental: {
    uniqueFields: [
      {
        name: 'areaOfInterest',
        label: 'Area of Interest',
        type: 'dropdown',
        options: [
          'Wildlife Conservation',
          'Waste Management',
          'Climate Awareness',
          'Tree Planting',
        ],
      },
      {
        name: 'volunteerExperience',
        label: 'Prior volunteer experience',
        type: 'textarea',
        placeholder: 'Describe your past volunteer work...',
      },
      {
        name: 'weekendAvailable',
        label: 'Are you available on weekends?',
        type: 'radio',
        options: ['Yes', 'No'],
      },
    ],
  },
  foc: {
    uniqueFields: [
      {
        name: 'roleInterested',
        label: 'Role Interested In',
        type: 'dropdown',
        options: [
          'Event Planning',
          'Marketing & Design',
          'Photography',
          'Logistics',
          'MC & Hosting',
        ],
      },
      {
        name: 'eventExperience',
        label: 'Event experience',
        type: 'textarea',
        placeholder: 'Tell us about your event experience...',
      },
      {
        name: 'softwareSkills',
        label: 'Software skills (e.g. Canva, Photoshop)',
        type: 'text',
        placeholder: 'List your software skills...',
      },
    ],
  },
  food: {
    uniqueFields: [
      {
        name: 'cookingExperience',
        label: 'Cooking Experience',
        type: 'dropdown',
        options: ['No experience', 'Home cook', 'Professionally trained'],
      },
      {
        name: 'cuisineInterest',
        label: 'Cuisine Interest',
        type: 'dropdown',
        options: ['Local', 'Continental', 'Baking & Pastry', 'All'],
      },
      {
        name: 'dietaryPreference',
        label: 'Dietary Preference',
        type: 'dropdown',
        options: ['None', 'Vegetarian', 'Vegan'],
      },
    ],
  },
};

export const COMMUNITIES_DATA = {
  cricket: {
    id: "cricket",
    name: "Cricket Club",
    logo: "/Image-communities/logo01.png",
    bgImage: "/Image-communities/Community01.jpg",
    description: "The Cricket Club at our university is more than just a sports team; it is a community built on the pillars of discipline, teamwork, and an unwavering passion for the gentleman’s game. Unleash your inner athlete and be part of a squad that plays with heart and determination in every match, from local friendlies to intense inter-university tournaments.Whether you are a beginner picking up a bat for the first time or a seasoned player looking to refine your yorkers and cover drives, this is your premier platform to grow, compete, and create unforgettable moments on the field. We provide structured training sessions, access to quality gear, and a supportive environment where leadership and sportsmanship are cultivated. Beyond the boundaries, you will find a brotherhood of students dedicated to excellence. Join us today to represent our faculty, sharpen your skills, and leave a lasting legacy in the university's sporting history.",
    
notices: [
      { title: "Practice Session", body: "Practice session scheduled for Friday at 4:00 PM." },
      { title: "Tournament Open", body: "Inter-university tournament registrations are now open." },
      { title: "Player Selections", body: "New player selections will be held next week." },
      { title: "Indoor Nets", body: "Training sessions shifted to indoor nets due to weather." },
      { title: "Team Meeting", body: "Team meeting scheduled on Monday. Attendance mandatory." },
      { title: "Jersey Distribution", body: "Match jerseys distribution this Wednesday at sports office." }
    ]
  },
  hockey: {
    id: "hockey",
    name: "Hockey Club",
    logo: "/Image-communities/logo02.png",
    bgImage: "/Image-communities/Community02.jpg",
    description: "Hockey Club: Step onto the field with confidence and be part of a community that values teamwork, strength, and resilience. The Hockey Club is where dedication meets excitement, pushing you to perform your best and enjoy every game.",
    notices: [
      { title: "Weekly Practice", body: "Weekly practice on Thursday at 5:00 PM." },
      { title: "Friendly Match", body: "Friendly match with neighboring university this weekend." },
      { title: "New Equipment", body: "New equipment has arrived. Collect during practice." },
      { title: "Fitness Assessment", body: "Player fitness assessments next week (Compulsory)." },
      { title: "Tournament Lineup", body: "Team lineup for upcoming tournament announced Friday." },
      { title: "Ground Change", body: "Training ground shifted temporarily. Check notice board." }
    ]
  },
  environmental: {
    id: "environmental",
    name: "Environmental Community",
    logo: "/Image-communities/logo03.png",
    bgImage: "/Image-communities/Community03.jpg",
    description: "Environmental Community: Be the change you wish to see in the world. Join a community that cares deeply about the planet and works together to create a cleaner, greener future through impactful actions and meaningful initiatives.",
    notices: [
      { title: "Beach Clean-Up", body: "Beach clean-up campaign scheduled for Saturday morning." },
      { title: "Sustainability Workshop", body: "Awareness workshop on sustainability held next week." },
      { title: "Tree Planting", body: "Tree planting program on campus this Friday." },
      { title: "Monthly Meeting", body: "Monthly meeting to discuss upcoming green projects." },
      { title: "Volunteers Needed", body: "Volunteers needed for the recycling initiative." },
      { title: "Awareness Week", body: "Environmental awareness week activities begin Monday." }
    ]
  },
  foc: {
    id: "foc",
    name: "FOC Event Club",
    logo: "/Image-communities/logo04.png",
    bgImage: "/Image-communities/Community04.jpg",
    description: "FOC Event Club: Turn ideas into unforgettable experiences! The FOC Event Club empowers you to organize, lead, and shine by creating exciting events that bring students together and make campus life vibrant and fun.",
    notices: [
      { title: "Planning Meeting", body: "Planning meeting for upcoming tech event tomorrow." },
      { title: "Volunteers Required", body: "Volunteers required for event coordination." },
      { title: "Event Schedule", body: "Event schedule finalized and shared via official channels." },
      { title: "Mandatory Briefing", body: "Mandatory briefing session before the main event." },
      { title: "Feedback Session", body: "Feedback session for the last event this Friday." },
      { title: "New Proposals", body: "New event proposals open. Submit before deadline." }
    ]
  },
  food: {
    id: "food",
    name: "Food & Beverages Community",
    logo: "/Image-communities/logo05.png",
    bgImage: "/Image-communities/Community05.jpg",
    description: "Food & Beverages Community: Discover the joy of food, friendship, and unforgettable flavors. This community brings people together through shared tastes, fun events, and delicious experiences that make every moment worth savoring.",
    notices: [
      { title: "Festival Planning", body: "Food festival planning meeting scheduled for Tuesday." },
      { title: "Cooking Competition", body: "Registration for cooking competition now open." },
      { title: "Tasting Session", body: "Monthly tasting session held this Friday evening." },
      { title: "Stall Volunteers", body: "Volunteers needed for food stall coordination." },
      { title: "Safety Briefing", body: "Hygiene and safety briefing before the next event." },
      { title: "Menu Ideas", body: "New menu ideas welcome. Submit to organizing team." }
    ]
  }
};

export const CRICKET_CLUB = {
  name: 'Cricket Club',
  logo: '/assets/cricket-logo.png',
  description: 'Fostering sportsmanship and competitive cricket at university level since 2019.',
  adminId: 'admin_cricket_01',
  notices: [
    { id: 1, title: 'Practice rescheduled', content: 'This week practice moved to Friday 4pm.', date: '2026-03-21' },
    { id: 2, title: 'Tournament registration open', content: 'Register before March 30th.', date: '2026-03-20' },
  ],
  events: [
    { id: 1, title: 'Inter-university tournament', date: 'April 12, 2026', time: '9:00 AM', venue: 'Main Grounds' },
    { id: 2, title: 'Practice trials', date: 'April 5, 2026', time: '2:00 PM', venue: 'Ground B' },
  ]
}