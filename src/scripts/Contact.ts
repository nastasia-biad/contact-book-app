export interface IContact {
    id: string;
    name: string;
    phone: string;
    group: string;
    createdAt: number;
    updatedAt: number;
}


export class Contact implements IContact {
    public id: string;
    public name: string;
    public phone: string;
    public group: string;
    public createdAt: number;
    public updatedAt: number;

    constructor(name: string, phone: string, group: string) {
        this.id = this.generateId();
        this.name = this.validateName(name);
        this.phone = this.validatePhone(phone);
        this.group = this.validateGroup(group);
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }


    private generateId(): string {
        return 'contact_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }


    private validateName(name: string): string {
        const trimmedName = name.trim();

        if (!trimmedName) {
            throw new Error('Имя контакта не может быть пустым');
        }

        if (trimmedName.length > 100) {
            throw new Error('Имя контакта не может превышать 100 символов');
        }

        return trimmedName;
    }

    private validatePhone(phone: string): string {
        const trimmedPhone = phone.trim();

        if (!trimmedPhone) {
            throw new Error('Номер телефона не может быть пустым');
        }

        const digits = trimmedPhone.replace(/\D/g, '');

        const cleanDigits = digits.startsWith('8') ? '7' + digits.substring(1) : digits;

        if (cleanDigits.length !== 11) {
            throw new Error(`Номер должен содержать 11 цифр (сейчас: ${cleanDigits.length})`);
        }

        if (!cleanDigits.startsWith('7')) {
            throw new Error('Российский номер телефона должен начинаться с 7');
        }

        return '+7' + cleanDigits.substring(1);
    }

    private validateGroup(group: string): string {
        const trimmedGroup = group.trim();

        if (!trimmedGroup) {
            throw new Error('Группа не может быть пустой');
        }

        if (trimmedGroup.length > 50) {
            throw new Error('Название группы не может превышать 50 символов');
        }

        return trimmedGroup;
    }

    update(updates: Partial<Omit<IContact, 'id' | 'createdAt'>>): void {
        if (updates.name !== undefined) {
            this.name = this.validateName(updates.name);
        }

        if (updates.phone !== undefined) {
            this.phone = this.validatePhone(updates.phone);
        }

        if (updates.group !== undefined) {
            this.group = this.validateGroup(updates.group);
        }

        this.updatedAt = Date.now();
    }

    static createFromData(data: IContact): Contact {
        const contact = new Contact(data.name, data.phone, data.group);
        contact.id = data.id;
        contact.createdAt = data.createdAt || Date.now();
        contact.updatedAt = data.updatedAt || Date.now();
        return contact;
    }


    static isValid(data: unknown): data is IContact {
        if (typeof data !== 'object' || data === null) {
            return false;
        }

        const contact = data as IContact;

        return (
            typeof contact.id === 'string' &&
            typeof contact.name === 'string' &&
            typeof contact.phone === 'string' &&
            typeof contact.group === 'string' &&
            (typeof contact.createdAt === 'number' || contact.createdAt === undefined) &&
            (typeof contact.updatedAt === 'number' || contact.updatedAt === undefined)
        );
    }

    getFormattedPhone(): string {
        const digits = this.phone.replace(/\D/g, '');

        if (digits.length === 11 && digits.startsWith('7')) {
            return `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
        }

        if (digits.length === 11 && digits.startsWith('8')) {
            return `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
        }

        return this.phone;
    }

    isSamePhone(phone: string): boolean {
        const thisPhone = this.phone.replace(/\D/g, '');
        const otherPhone = phone.replace(/\D/g, '');

        const normalizedThis = thisPhone.startsWith('8') ? '7' + thisPhone.substring(1) : thisPhone;
        const normalizedOther = otherPhone.startsWith('8') ? '7' + otherPhone.substring(1) : otherPhone;

        return normalizedThis === normalizedOther;
    }

    static canUpdate(oldContact: Contact, newData: Partial<IContact>, existingContacts: Contact[]): string | null {

        if (newData.name !== undefined) {
            try {
                new Contact(newData.name, '79990000000', 'temp');
            } catch (error) {
                if (error instanceof Error) {
                    return error.message;
                }
                return 'Ошибка валидации имени';
            }
        }


        if (newData.phone !== undefined) {
            try {
                new Contact('Temp', newData.phone, 'temp');
            } catch (error) {
                if (error instanceof Error) {
                    return error.message;
                }
                return 'Ошибка валидации телефона';
            }

            const duplicate = existingContacts.find(contact =>
                contact.id !== oldContact.id &&
                contact.isSamePhone(newData.phone!)
            );

            if (duplicate) {
                return 'Контакт с таким номером телефона уже существует';
            }
        }

        if (newData.group !== undefined) {
            try {
                new Contact('Temp', '79990000000', newData.group);
            } catch (error) {
                if (error instanceof Error) {
                    return error.message;
                }
                return 'Ошибка валидации группы';
            }
        }

        return null;
    }
}