import { Contact, IContact } from './Contact';
import { Group, IGroup } from './Group';

export class StorageManager {
    private static readonly CONTACTS_KEY = 'contact-book-contacts-v2';
    private static readonly GROUPS_KEY = 'contact-book-groups-v2';

    private static contactsCache: Contact[] | null = null;
    private static groupsCache: Group[] | null = null;

    // ========== Контакты ==========

    static saveContacts(contacts: Contact[]): void {
        try {
            const data: IContact[] = contacts.map(contact => ({
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                group: contact.group,
                createdAt: contact.createdAt,
                updatedAt: contact.updatedAt
            }));

            localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(data));
            this.contactsCache = contacts;
        } catch (error) {
            console.error('Ошибка при сохранении контактов:', error);
            throw new Error('Не удалось сохранить контакты');
        }
    }

    static loadContacts(): Contact[] {
        if (this.contactsCache) {
            return this.contactsCache;
        }

        try {
            const data = localStorage.getItem(this.CONTACTS_KEY);
            if (!data) {
                this.contactsCache = [];
                return [];
            }

            const parsedData: unknown = JSON.parse(data);
            if (!Array.isArray(parsedData)) {
                throw new Error('Данные контактов имеют неверный формат');
            }

            const contacts = parsedData
                .filter(Contact.isValid)
                .map(data => Contact.createFromData(data as IContact))
                .sort((a, b) => b.updatedAt - a.updatedAt);

            this.contactsCache = contacts;
            return contacts;
        } catch (error) {
            console.error('Ошибка при загрузке контактов:', error);
            this.contactsCache = [];
            return [];
        }
    }


    static addContact(contact: Contact): void {
        const contacts = this.loadContacts();

        const duplicate = contacts.find(c => c.isSamePhone(contact.phone));
        if (duplicate) {
            throw new Error('Контакт с таким номером телефона уже существует');
        }

        contacts.push(contact);
        this.saveContacts(contacts);

        this.updateGroupContactCount(contact.group, 1);
    }

    static updateContact(updatedContact: Contact): void {
        const contacts = this.loadContacts();
        const index = contacts.findIndex(c => c.id === updatedContact.id);

        if (index === -1) {
            throw new Error('Контакт не найден');
        }

        const oldContact = contacts[index];

        const duplicate = contacts.find(c =>
            c.id !== updatedContact.id &&
            c.isSamePhone(updatedContact.phone)
        );
        if (duplicate) {
            throw new Error('Контакт с таким номером телефона уже существует');
        }

        if (oldContact.group !== updatedContact.group) {
            this.updateGroupContactCount(oldContact.group, -1);
            this.updateGroupContactCount(updatedContact.group, 1);
        }

        contacts[index] = updatedContact;
        this.saveContacts(contacts);
    }


    static deleteContact(contactId: string): Contact | null {
        const contacts = this.loadContacts();
        const contact = contacts.find(c => c.id === contactId);

        if (!contact) {
            return null;
        }

        const filteredContacts = contacts.filter(c => c.id !== contactId);
        this.saveContacts(filteredContacts);

        this.updateGroupContactCount(contact.group, -1);

        return contact;
    }


    static deleteContactsByGroup(groupName: string): number {
        const contacts = this.loadContacts();
        const contactsInGroup = contacts.filter(c => c.group === groupName);

        if (contactsInGroup.length === 0) {
            return 0;
        }

        const remainingContacts = contacts.filter(c => c.group !== groupName);
        this.saveContacts(remainingContacts);

        return contactsInGroup.length;
    }


    static getContactById(contactId: string): Contact | null {
        const contacts = this.loadContacts();
        return contacts.find(c => c.id === contactId) || null;
    }


    static getContactsByGroup(groupName: string): Contact[] {
        const contacts = this.loadContacts();
        return contacts.filter(c => c.group === groupName);
    }


    static contactExists(phone: string, excludeContactId?: string): boolean {
        const contacts = this.loadContacts();
        return contacts.some(contact =>
            (excludeContactId ? contact.id !== excludeContactId : true) &&
            contact.isSamePhone(phone)
        );
    }

    // ========== Группы ==========


    static saveGroups(groups: Group[]): void {
        try {
            const data: IGroup[] = groups.map(group => ({
                id: group.id,
                name: group.name,
                createdAt: group.createdAt,
                contactCount: group.contactCount
            }));

            localStorage.setItem(this.GROUPS_KEY, JSON.stringify(data));
            this.groupsCache = groups;
        } catch (error) {
            console.error('Ошибка при сохранении групп:', error);
            throw new Error('Не удалось сохранить группы');
        }
    }


    static loadGroups(): Group[] {
        if (this.groupsCache) {
            return this.groupsCache;
        }

        try {
            const data = localStorage.getItem(this.GROUPS_KEY);
            let groups: Group[];

            if (!data) {
                groups = [
                    new Group('Семья'),
                    new Group('Друзья'),
                    new Group('Коллеги'),
                    new Group('Важные')
                ];
                this.saveGroups(groups);
                this.groupsCache = groups;
                return groups;
            }

            const parsedData: unknown = JSON.parse(data);
            if (!Array.isArray(parsedData)) {
                throw new Error('Данные групп имеют неверный формат');
            }

            groups = parsedData
                .filter(Group.isValid)
                .map(data => Group.createFromData(data as IGroup))
                .sort(Group.compare);

            const contacts = this.loadContacts();
            groups.forEach(group => {
                group.contactCount = contacts.filter(c => c.group === group.name).length;
            });

            this.groupsCache = groups;
            return groups;
        } catch (error) {
            console.error('Ошибка при загрузке групп:', error);
            this.groupsCache = [];
            return [];
        }
    }


    static addGroup(group: Group): void {
        const groups = this.loadGroups();

        if (!Group.isNameUnique(group.name, groups)) {
            throw new Error('Группа с таким названием уже существует');
        }

        groups.push(group);
        groups.sort(Group.compare);
        this.saveGroups(groups);
    }


    static updateGroup(updatedGroup: Group): void {
        const groups = this.loadGroups();
        const index = groups.findIndex(g => g.id === updatedGroup.id);

        if (index === -1) {
            throw new Error('Группа не найдена');
        }

        const oldGroup = groups[index];

        if (!Group.isNameUnique(updatedGroup.name, groups, updatedGroup.id)) {
            throw new Error('Группа с таким названием уже существует');
        }

        if (oldGroup.name !== updatedGroup.name) {
            this.updateContactsGroupName(oldGroup.name, updatedGroup.name);
        }

        groups[index] = updatedGroup;
        groups.sort(Group.compare);
        this.saveGroups(groups);
    }


    static deleteGroup(groupId: string): { group: Group; deletedContacts: number } {
        const groups = this.loadGroups();
        const groupIndex = groups.findIndex(g => g.id === groupId);

        if (groupIndex === -1) {
            throw new Error('Группа не найдена');
        }

        const groupToDelete = groups[groupIndex];

        const deletedContacts = this.deleteContactsByGroup(groupToDelete.name);

        groups.splice(groupIndex, 1);
        this.saveGroups(groups);

        return {
            group: groupToDelete,
            deletedContacts
        };
    }


    static getGroupById(groupId: string): Group | null {
        const groups = this.loadGroups();
        return groups.find(g => g.id === groupId) || null;
    }


    static getGroupByName(groupName: string): Group | null {
        const groups = this.loadGroups();
        return groups.find(g => g.name === groupName) || null;
    }


    static groupExists(groupName: string, excludeGroupId?: string): boolean {
        const groups = this.loadGroups();
        return groups.some(group =>
            (excludeGroupId ? group.id !== excludeGroupId : true) &&
            group.name.toLowerCase() === groupName.toLowerCase()
        );
    }

    // ========== Вспомогательные методы ==========


    private static updateGroupContactCount(groupName: string, delta: number): void {
        const groups = this.loadGroups();
        const group = groups.find(g => g.name === groupName);

        if (group) {
            if (delta > 0) {
                group.incrementContactCount();
            } else if (delta < 0) {
                group.decrementContactCount();
            }

            this.saveGroups(groups);
        }
    }


    private static updateContactsGroupName(oldName: string, newName: string): void {
        const contacts = this.loadContacts();
        let updated = false;

        for (const contact of contacts) {
            if (contact.group === oldName) {
                contact.group = newName;
                contact.updatedAt = Date.now();
                updated = true;
            }
        }

        if (updated) {
            this.saveContacts(contacts);
        }
    }


    static clearCache(): void {
        this.contactsCache = null;
        this.groupsCache = null;
    }


    static clearAllData(): void {
        localStorage.removeItem(this.CONTACTS_KEY);
        localStorage.removeItem(this.GROUPS_KEY);
        this.clearCache();
    }


    static isEmpty(): boolean {
        const contacts = this.loadContacts();
        const groups = this.loadGroups();

        return contacts.length === 0 && groups.length <= 4;
    }


    static exportData(): string {
        const contacts = this.loadContacts();
        const groups = this.loadGroups();

        const data = {
            contacts: contacts.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                group: c.group,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt
            })),
            groups: groups.map(g => ({
                id: g.id,
                name: g.name,
                createdAt: g.createdAt,
                contactCount: g.contactCount
            })),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        return JSON.stringify(data, null, 2);
    }


    static importData(jsonData: string): void {
        try {
            const data = JSON.parse(jsonData);

            if (!data.contacts || !Array.isArray(data.contacts) ||
                !data.groups || !Array.isArray(data.groups)) {
                throw new Error('Неверный формат данных');
            }

            const validContacts = data.contacts
                .filter(Contact.isValid)
                .map((c: IContact) => Contact.createFromData(c));

            const validGroups = data.groups
                .filter(Group.isValid)
                .map((g: IGroup) => Group.createFromData(g));

            const uniqueGroups: Group[] = [];
            validGroups.forEach((group: Group) => {
                if (!uniqueGroups.some(g => g.name.toLowerCase() === group.name.toLowerCase())) {
                    uniqueGroups.push(group);
                }
            });

            this.saveContacts(validContacts);
            this.saveGroups(uniqueGroups);

        } catch (error) {
            console.error('Ошибка при импорте данных:', error);
            throw new Error('Не удалось импортировать данные');
        }
    }
}