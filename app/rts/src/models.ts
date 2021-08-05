export class AppUser {
    name: string;
    email: string;

    constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
    }
}

export class CurrentAppEditorEvent {
    appId: string;
    users: AppUser [];

    constructor(appId: string, users: AppUser []) {
        this.appId = appId;
        this.users = users;
    }
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
}