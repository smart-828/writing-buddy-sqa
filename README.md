# Writing Buddy

National 5 Scotland / GCSE England writing practice app with AI feedback and progress tracking.

## Tech stack
- React (Create React App)
- Firebase (Auth + Firestore)
- Anthropic Claude API (feedback engine)
- Vercel (hosting)

## Setup

### 1. Clone and install
```bash
git clone https://github.com/smart-828/writing-buddy-sqa.git
cd writing-buddy-sqa
npm install
```

### 2. Environment variables
Create a `.env` file in the root:
```
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Firebase setup
- Firebase project: `writing-buddy-sqa`
- Enable Firestore and Email/Password auth (already done)
- Deploy Firestore security rules:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 4. Create your admin account
In Firebase Console → Authentication → Add user manually with your email and password.

Then in Firestore → Create a document in `profiles` collection with the document ID matching your Firebase Auth UID:
```json
{
  "display_name": "Patrick",
  "email": "your@email.com",
  "role": "admin",
  "total_stars": 0
}
```

### 5. Run locally
```bash
npm start
```

### 6. Deploy to Vercel
- Push to GitHub
- Connect repo in Vercel
- Add environment variable: `REACT_APP_ANTHROPIC_API_KEY`
- Deploy

## App structure

```
src/
  lib/
    firebase.js        Firebase config
    db.js              All Firestore operations
  prompts/
    aiPrompts.js       AI system prompts (N5 + GCSE)
  hooks/
    useAuth.js         Auth context
  components/shared/
    UI.jsx             Shared components
  pages/
    LoginPage.jsx
    admin/
      AdminDashboard.jsx      Student list
      AdminStudentDetail.jsx  Submissions + trend + AI summary
      AdminNewStudent.jsx     Create student account
      AdminPrompts.jsx        Manage writing prompts
    student/
      StudentHome.jsx         Star total + write choice
      StudentPromptPicker.jsx Browse prompts
      StudentWritingEditor.jsx Full-screen editor
      StudentFeedback.jsx     AI feedback + stars
      StudentProgress.jsx     Trend chart + personal bests
```

## Phases
- Phase 1 ✅ Foundation (auth, database, routing)
- Phase 2 ✅ Core loop (prompts, editor, AI feedback, stars)
- Phase 3 ✅ Progress tracking (trends, personal bests, AI summary)
