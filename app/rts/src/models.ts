export class AppUser {
    name: string;
    email: string;

    constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
    }
}

export class CurrentEditorsEvent {
    resourceId: string;
    users: AppUser [];

    constructor(resourceId: string, users: AppUser []) {
        this.resourceId = resourceId;
        this.users = users;
    }
}

export class MousePointerEvent {
    pageId: string
    socketId: string
    user: AppUser
    data: object
}

export interface Policy {
	permission: string
	users: string[]
	groups: string[]
}

export interface CommentThread {
    applicationId: string
}

export interface Comment {
    threadId: string
    policies: Policy[]
    createdAt: string
    updatedAt: string
    creationTime: string
    updationTime: string
    deleted: boolean
}