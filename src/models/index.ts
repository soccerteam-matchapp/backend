// src/models/index.ts
// 모든 MongoDB 모델과 인터페이스를 한 곳에서 export

// User
export { User, type IUser } from './user.model';

// Team
export { Team, type ITeam } from './team.model';

// Match
export { Match, type IMatch, type MatchSkill } from './match.model';

// Notification
export { Notification, type INotification, type NotificationType } from './notification.model';

// TeamRating
export { TeamRating, type ITeamRating } from './teamRating.model';

// AttendancePoll
export { AttendancePoll, type IAttendancePoll } from './attendancePoll.model';

// PhoneVerification (default export이므로 다르게 처리)
export { default as PhoneVerification, type IPhoneVerification } from './phoneVerification.model';

