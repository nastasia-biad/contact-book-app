import { Contact } from './Contact';
import { Group } from './Group';
import { StorageManager } from './Storage';
import { ToastManager } from './utils/toast';


export class UI {
    private static currentContactId: string | null = null;
    private static groupToDelete: string | null = null;
    private static editingGroupId: string | null = null;
    private static originalGroupName: string = '';


    static async initialize(): Promise<void> {
        try {
            ToastManager.initialize();
            this.setupPhoneInput();
            this.renderContacts();
            this.renderGroups();
            this.setupEventListeners();

            ToastManager.info('Приложение инициализировано');
        } catch (error) {
            console.error('Ошибка при инициализации UI:', error);
            ToastManager.error('Ошибка при инициализации приложения');
        }
    }

    private static setupPhoneInput(): void {
        const phoneInput = document.getElementById('contactPhone') as HTMLInputElement;
        if (!phoneInput) return;

        phoneInput.placeholder = '+7 (999) 999-99-99';

        phoneInput.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
            let value = input.value.replace(/\D/g, '');

            if (value.length > 11) {
                value = value.substring(0, 11);
            }

            let formatted = '';
            if (value.length > 0) {
                if (value.startsWith('8')) {
                    value = '7' + value.substring(1);
                }

                if (!value.startsWith('7')) {
                    value = '7' + value;
                }

                const code = value.substring(1, 4);
                const part1 = value.substring(4, 7);
                const part2 = value.substring(7, 9);
                const part3 = value.substring(9, 11);

                formatted = '+7';
                if (code) formatted += ' (' + code;
                if (part1) formatted += ') ' + part1;
                if (part2) formatted += '-' + part2;
                if (part3) formatted += '-' + part3;
            }

            input.value = formatted;
        });
    }


    private static setupEventListeners(): void {
        document.getElementById('addContactBtn')?.addEventListener('click', () =>
            this.showContactModal()
        );

        document.getElementById('groupsBtn')?.addEventListener('click', () =>
            this.showGroupsSidebar()
        );

        document.getElementById('groupsSidebarClose')?.addEventListener('click', () =>
            this.hideGroupsSidebar()
        );

        document.getElementById('groupsSidebarOverlay')?.addEventListener('click', () =>
            this.hideGroupsSidebar()
        );

        document.getElementById('sidebarCancelBtn')?.addEventListener('click', () =>
            this.hideGroupsSidebar()
        );

        document.getElementById('sidebarSaveBtn')?.addEventListener('click', () =>
            this.saveGroupsChanges()
        );

        document.getElementById('sidebarAddBtn')?.addEventListener('click', () =>
            this.handleAddGroupFromSidebar()
        );

        document.getElementById('addContactBtnMobile')?.addEventListener('click', () =>
            this.showContactModal()
        );

        const sidebarGroupInput = document.getElementById('sidebarGroupInput') as HTMLInputElement;
        if (sidebarGroupInput) {
            sidebarGroupInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAddGroupFromSidebar();
                }
            });
        }

        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmit();
            });
        }

        document.getElementById('confirmCancel')?.addEventListener('click', () => {
            console.log('Cancel button clicked');
            this.hideModal('confirmModal');
        });

        document.getElementById('confirmDelete')?.addEventListener('click', () => {
            console.log('Delete button clicked, groupToDelete:', this.groupToDelete);
            this.confirmGroupDelete();
        });

        document.getElementById('contactModalClose')?.addEventListener('click', () =>
            this.hideContactModal()
        );

        document.getElementById('contactModalCancel')?.addEventListener('click', () =>
            this.hideContactModal()
        );

        document.getElementById('contactModalOverlay')?.addEventListener('click', () =>
            this.hideContactModal()
        );

        document.getElementById('confirmModalClose')?.addEventListener('click', () =>
            this.hideModal('confirmModal')
        );

        document.getElementById('confirmModalOverlay')?.addEventListener('click', () =>
            this.hideModal('confirmModal')
        );

        const groupToggle = document.getElementById('groupToggle');
        if (groupToggle) {
            groupToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleGroupDropdown();
            });
        }

        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('groupDropdown');
            if (dropdown?.classList.contains('open') &&
                !(e.target as Element).closest('.custom-dropdown')) {
                dropdown.classList.remove('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    static renderContacts(): void {
        const contactsList = document.getElementById('contactsList');
        const emptyState = document.getElementById('emptyState');

        if (!contactsList || !emptyState) return;

        const contacts = StorageManager.loadContacts();
        const groups = StorageManager.loadGroups();

        contactsList.innerHTML = '';

        if (contacts.length === 0) {
            contactsList.classList.add('empty');
            emptyState.classList.remove('hidden');
            return;
        }

        contactsList.classList.remove('empty');
        emptyState.classList.add('hidden');

        const groupedContacts: Record<string, Contact[]> = {};

        contacts.forEach(contact => {
            if (!groupedContacts[contact.group]) {
                groupedContacts[contact.group] = [];
            }
            groupedContacts[contact.group].push(contact);
        });

        const sortedGroups = groups
            .filter(group => groupedContacts[group.name]?.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

        sortedGroups.forEach((group, index) => {
            const groupContacts = groupedContacts[group.name] || [];
            const groupElement = document.createElement('div');
            groupElement.className = 'contacts-group';

            const isExpanded = index === 0;

            groupElement.innerHTML = `
                <button class="contacts-group__header ${isExpanded ? 'expanded' : ''}" 
                        data-group="${this.escapeHtml(group.name)}">
                    <div class="contacts-group__title">
                        ${this.escapeHtml(group.name)}
                        <span class="contacts-group__count">${groupContacts.length}</span>
                    </div>
                    <div class="contacts-group__arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                </button>
                <div class="contacts-group__content ${isExpanded ? 'expanded' : ''}" 
                     id="group-content-${this.escapeHtml(group.name)}">
                    ${this.renderContactsList(groupContacts)}
                </div>
            `;
            contactsList.appendChild(groupElement);
        });

        this.setupGroupAccordions();
    }


    private static renderContactsList(contacts: Contact[]): string {
        if (contacts.length === 0) {
            return `<div class="contacts-group__item contacts-group__item--empty">В этой группе пока нет контактов</div>`;
        }

        return `
        <div class="contacts-group__list">
            ${contacts.map(contact => `
                <div class="contacts-group__item" data-id="${contact.id}">
                    <div class="contacts-group__item-info">
                        <div class="contacts-group__item-name-container">
                            <div class="contacts-group__item-name">${this.escapeHtml(contact.name)}</div>
                        </div>
                        <div class="contacts-group__item-phone">
                            ${this.escapeHtml(contact.getFormattedPhone())}
                        </div>
                    </div>
                    <div class="contacts-group__item-actions">
                        <button class="contacts-group__item-action contacts-group__item-action--edit" 
                                title="Редактировать контакт" 
                                aria-label="Редактировать контакт">
                            <svg class="contacts-group__item-icon" width="24" height="24" viewBox="0 0 24 24">
                                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"/>
                            </svg>
                        </button>
                        <button class="contacts-group__item-action contacts-group__item-action--delete" 
                                title="Удалить контакт" 
                                aria-label="Удалить контакт">
                            <svg class="contacts-group__item-icon" width="26" height="26" viewBox="0 0 26 26">
                                <path d="M6.33339 20.0556C6.33339 21.2167 7.28339 22.1667 8.4445 22.1667H16.8889C18.0501 22.1667 19.0001 21.2167 19.0001 20.0556V7.38891H6.33339V20.0556ZM8.93005 12.54L10.4184 11.0517L12.6667 13.2895L14.9045 11.0517L16.3928 12.54L14.1551 14.7778L16.3928 17.0156L14.9045 18.5039L12.6667 16.2661L10.4289 18.5039L8.94061 17.0156L11.1784 14.7778L8.93005 12.54ZM16.3612 4.22224L15.3056 3.16669H10.0278L8.97228 4.22224H5.27783V6.33335H20.0556V4.22224H16.3612Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    }


    private static setupGroupAccordions(): void {
        document.querySelectorAll('.contacts-group__header').forEach(header => {
            header.addEventListener('click', () => {
                const groupName = header.getAttribute('data-group');
                const content = document.getElementById(`group-content-${groupName}`);

                if (!content) return;

                const isExpanded = header.classList.contains('expanded');

                document.querySelectorAll('.contacts-group__header.expanded').forEach(otherHeader => {
                    if (otherHeader !== header) {
                        otherHeader.classList.remove('expanded');
                        const otherGroupName = otherHeader.getAttribute('data-group');
                        const otherContent = document.getElementById(`group-content-${otherGroupName}`);
                        if (otherContent) {
                            otherContent.classList.remove('expanded');
                        }
                    }
                });

                if (isExpanded) {
                    header.classList.remove('expanded');
                    content.classList.remove('expanded');
                } else {
                    header.classList.add('expanded');
                    content.classList.add('expanded');
                }
            });
        });

        document.querySelectorAll('.contacts-group__item-action--edit').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const contactElement = button.closest('.contacts-group__item');
                const contactId = contactElement?.getAttribute('data-id');
                if (contactId) {
                    const contact = StorageManager.getContactById(contactId);
                    if (contact) {
                        this.showContactModal(contact);
                    }
                }
            });
        });

        document.querySelectorAll('.contacts-group__item-action--delete').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const contactElement = button.closest('.contacts-group__item');
                const contactId = contactElement?.getAttribute('data-id');
                if (contactId) {
                    this.deleteContact(contactId);
                }
            });
        });
    }


    static renderGroups(): void {
        this.renderSidebarGroups();
        this.renderGroupDropdown();
    }


    private static renderSidebarGroups(): void {
        const sidebarList = document.getElementById('sidebarGroupsList');
        if (!sidebarList) return;

        const groups = StorageManager.loadGroups();
        console.log('Rendering groups:', groups);

        sidebarList.innerHTML = groups.map(group => `
            <div class="sidebar-group-item" data-id="${group.id}">
                <div class="sidebar-group-item__name">
                    <span class="sidebar-group-item__name-text">${this.escapeHtml(group.name)}</span>
                    <input type="text" class="sidebar-group-item__name-input" 
                           value="${this.escapeHtml(group.name)}" maxlength="50">
                </div>
                <button class="sidebar-group-item__delete" type="button" 
                        title="Удалить группу" aria-label="Удалить группу"
                        data-group-id="${group.id}">
                    <img src="./assets/img/delete.svg" alt="Удалить" class="sidebar-group-item__delete-icon">
                </button>
            </div>
        `).join('');

        sidebarList.querySelectorAll('.sidebar-group-item').forEach((item, index) => {
            const groupId = groups[index].id;
            console.log('Setting up handlers for group:', groupId);

            item.addEventListener('dblclick', () => {
                console.log('Double click on group:', groupId);
                this.startGroupEdit(groupId);
            });
            item.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).closest('.sidebar-group-item__delete')) {
                    this.cancelGroupEdit();
                }
            });

            const nameInput = item.querySelector('.sidebar-group-item__name-input') as HTMLInputElement;
            if (nameInput) {
                nameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.saveGroupEdit(groupId, nameInput.value);
                    }
                });

                nameInput.addEventListener('blur', () => {
                    if (this.editingGroupId === groupId) {
                        this.saveGroupEdit(groupId, nameInput.value);
                    }
                });
            }

            const deleteBtn = item.querySelector('.sidebar-group-item__delete');
            if (deleteBtn) {
                deleteBtn.replaceWith(deleteBtn.cloneNode(true));
                const newDeleteBtn = item.querySelector('.sidebar-group-item__delete');

                if (newDeleteBtn) {
                    newDeleteBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Delete button clicked directly for group:', groupId);
                        console.log('Event target:', e.target);
                        console.log('Current target:', e.currentTarget);
                        this.showDeleteGroupConfirm(groupId);
                    });
                }
            }
        });
    }

    private static renderGroupDropdown(): void {
        const groupDropdown = document.getElementById('groupDropdown');
        if (!groupDropdown) return;

        const groups = StorageManager.loadGroups();

        groupDropdown.innerHTML = groups.map(group => `
            <button class="custom-dropdown__item" 
                    data-id="${group.id}" 
                    data-name="${this.escapeHtml(group.name)}"
                    type="button">
                ${this.escapeHtml(group.name)}
            </button>
        `).join('');

        groupDropdown.querySelectorAll('.custom-dropdown__item').forEach(item => {
            item.addEventListener('click', () => this.selectGroup(item));
        });
    }


    private static selectGroup(item: Element): void {
        const groupName = item.getAttribute('data-name');
        const groupId = item.getAttribute('data-id');
        const groupToggle = document.getElementById('groupToggle');
        const groupInput = document.getElementById('contactGroup') as HTMLInputElement;

        if (groupToggle && groupName && groupInput) {
            const selectedSpan = groupToggle.querySelector('.custom-dropdown__selected');
            if (selectedSpan) {
                selectedSpan.textContent = groupName;
                selectedSpan.classList.remove('placeholder');
            }

            groupInput.value = groupName;

            groupToggle.setAttribute('aria-label', `Выбрана группа: ${groupName}`);

            if (groupId) {
                groupInput.dataset.groupId = groupId;
            }

            const dropdownItems = document.querySelectorAll('.custom-dropdown__item');
            dropdownItems.forEach(dropdownItem => {
                dropdownItem.classList.remove('selected');
                dropdownItem.setAttribute('aria-selected', 'false');
            });

            item.classList.add('selected');
            item.setAttribute('aria-selected', 'true');

            this.hideGroupDropdown();

            const groupError = document.getElementById('contactGroupError');
            if (groupError) {
                groupError.classList.remove('active');
                groupError.textContent = '';
            }

            if (groupToggle.classList.contains('error')) {
                groupToggle.classList.remove('error');
            }
        }
    }

    static toggleGroupDropdown(): void {
        const dropdown = document.getElementById('groupDropdown');
        const toggle = document.getElementById('groupToggle');

        if (dropdown && toggle) {
            const isOpen = dropdown.classList.contains('open');

            document.querySelectorAll('.custom-dropdown__menu.open').forEach(menu => {
                if (menu !== dropdown) {
                    menu.classList.remove('open');
                    const otherToggle = menu.closest('.custom-dropdown')?.querySelector('.custom-dropdown__toggle');
                    if (otherToggle) {
                        otherToggle.classList.remove('active');
                        otherToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });

            if (isOpen) {
                dropdown.classList.remove('open');
                toggle.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.setAttribute('aria-activedescendant', '');
            } else {
                dropdown.classList.add('open');
                toggle.classList.add('active');
                toggle.setAttribute('aria-expanded', 'true');

                const selectedItem = dropdown.querySelector('.custom-dropdown__item.selected');
                if (selectedItem && selectedItem.id) {
                    toggle.setAttribute('aria-activedescendant', selectedItem.id);
                }

                const rect = toggle.getBoundingClientRect();
                dropdown.style.width = `${rect.width}px`;
            }
        }
    }

    private static hideGroupDropdown(): void {
        const dropdown = document.getElementById('groupDropdown');
        const toggle = document.getElementById('groupToggle');

        if (dropdown && toggle) {
            dropdown.classList.remove('open');
            toggle.classList.remove('active');
        }
    }

    static showGroupsSidebar(): void {
        console.log('Showing groups sidebar');
        this.hideAllModals();
        this.hideGroupDropdown();
        this.editingGroupId = null;
        this.originalGroupName = '';

        const sidebar = document.getElementById('groupsSidebar');
        if (sidebar) {
            sidebar.classList.add('active');
            this.renderSidebarGroups();

            const input = document.getElementById('sidebarGroupInput') as HTMLInputElement;
            setTimeout(() => input?.focus(), 100);
        }
    }

    static hideGroupsSidebar(): void {
        const sidebar = document.getElementById('groupsSidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
            this.cancelGroupEdit();
        }
    }


    private static startGroupEdit(groupId: string): void {
        const groups = StorageManager.loadGroups();
        const group = groups.find(g => g.id === groupId);

        if (!group) return;

        this.cancelGroupEdit();

        this.editingGroupId = groupId;
        this.originalGroupName = group.name;

        const item = document.querySelector(`.sidebar-group-item[data-id="${groupId}"]`);
        if (item) {
            item.classList.add('editing');

            const input = item.querySelector('.sidebar-group-item__name-input') as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        }
    }


    private static saveGroupEdit(groupId: string, newName: string): void {
        if (!groupId || !newName.trim()) return;

        const groups = StorageManager.loadGroups();
        const group = groups.find(g => g.id === groupId);

        if (!group) return;

        const trimmedName = newName.trim();

        if (trimmedName === this.originalGroupName) {
            this.cancelGroupEdit();
            return;
        }

        try {
            const validationError = Group.validateName(trimmedName, groups, groupId);
            if (validationError) {
                ToastManager.error(validationError);

                const item = document.querySelector(`.sidebar-group-item[data-id="${groupId}"]`);
                if (item) {
                    const input = item.querySelector('.sidebar-group-item__name-input') as HTMLInputElement;
                    if (input) {
                        input.value = this.originalGroupName;
                        input.focus();
                    }
                }
                return;
            }

            group.update(trimmedName);
            StorageManager.updateGroup(group);

            this.renderSidebarGroups();
            this.renderGroupDropdown();
            this.renderContacts();

            ToastManager.success('Группа успешно обновлена');

            this.editingGroupId = null;
            this.originalGroupName = '';

        } catch (error) {
            console.error('Ошибка при обновлении группы:', error);
            ToastManager.error(error instanceof Error ? error.message : 'Ошибка при обновлении группы');
        }
    }

    private static cancelGroupEdit(): void {
        if (this.editingGroupId) {
            const item = document.querySelector(`.sidebar-group-item[data-id="${this.editingGroupId}"]`);
            if (item) {
                item.classList.remove('editing');

                const input = item.querySelector('.sidebar-group-item__name-input') as HTMLInputElement;
                const text = item.querySelector('.sidebar-group-item__name-text');
                if (input && text) {
                    input.value = text.textContent || '';
                }
            }

            this.editingGroupId = null;
            this.originalGroupName = '';
        }
    }

    private static handleAddGroupFromSidebar(): void {
        const input = document.getElementById('sidebarGroupInput') as HTMLInputElement;
        const name = input.value.trim();

        if (!name) {
            ToastManager.error('Введите название группы');
            input.focus();
            return;
        }

        const groups = StorageManager.loadGroups();
        const validationError = Group.validateName(name, groups);

        if (validationError) {
            ToastManager.error(validationError);
            return;
        }

        try {
            const group = new Group(name);
            StorageManager.addGroup(group);

            ToastManager.success('Группа успешно создана');
            input.value = '';

            this.renderSidebarGroups();
            this.renderGroupDropdown();

            input.focus();

        } catch (error) {
            console.error('Ошибка при добавлении группы:', error);
            ToastManager.error(error instanceof Error ? error.message : 'Ошибка при добавлении группы');
        }
    }

    private static saveGroupsChanges(): void {
        if (this.editingGroupId) {
            const item = document.querySelector(`.sidebar-group-item[data-id="${this.editingGroupId}"]`);
            if (item) {
                const input = item.querySelector('.sidebar-group-item__name-input') as HTMLInputElement;
                if (input) {
                    this.saveGroupEdit(this.editingGroupId, input.value);
                }
            }
        }

        this.hideGroupsSidebar();

        ToastManager.success('Изменения сохранены');
    }

    static showContactModal(contact?: Contact): void {
        this.hideAllModals();

        const modal = document.getElementById('contactModal');
        const title = modal?.querySelector('.modal__title') as HTMLElement;
        const form = document.getElementById('contactForm') as HTMLFormElement;
        const nameInput = document.getElementById('contactName') as HTMLInputElement;
        const phoneInput = document.getElementById('contactPhone') as HTMLInputElement;
        const groupToggle = document.getElementById('groupToggle');

        this.clearFormErrors();

        if (contact) {
            this.currentContactId = contact.id;
            title.textContent = 'Редактировать контакт';
            nameInput.value = contact.name;

            if (phoneInput) {
                phoneInput.value = contact.getFormattedPhone();
            }

            if (groupToggle) {
                const selectedSpan = groupToggle.querySelector('.custom-dropdown__selected');
                if (selectedSpan) {
                    selectedSpan.textContent = contact.group;
                    selectedSpan.classList.remove('placeholder');
                }
            }

            const groupInput = document.getElementById('contactGroup') as HTMLInputElement;
            if (groupInput) {
                groupInput.value = contact.group;
            }
        } else {
            this.currentContactId = null;
            title.textContent = 'Добавить контакт';
            form.reset();

            if (phoneInput) {
                phoneInput.value = '';
            }

            if (groupToggle) {
                const selectedSpan = groupToggle.querySelector('.custom-dropdown__selected');
                if (selectedSpan) {
                    selectedSpan.textContent = 'Выберите группу';
                    selectedSpan.classList.add('placeholder');
                }
            }
        }

        modal?.classList.add('active');
        setTimeout(() => nameInput.focus(), 100);
    }

    static showDeleteGroupConfirm(groupId: string): void {
        console.log('showDeleteGroupConfirm called with:', groupId);

        this.groupToDelete = groupId;
        console.log('groupToDelete set to:', this.groupToDelete);

        this.hideAllModals();

        const group = StorageManager.getGroupById(groupId);
        if (!group) {
            ToastManager.error('Группа не найдена');
            this.groupToDelete = null;
            return;
        }

        const modalText = document.getElementById('confirmModalText');
        if (modalText) {
            modalText.textContent = `Вы уверены, что хотите удалить группу "${group.name}"? Это приведет к удалению всех контактов (${group.contactCount}), находящихся в этой группе.`;
        }

        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.add('active');
            console.log('Confirm modal shown, groupToDelete:', this.groupToDelete);
        }
    }

    private static hideModal(modalId: string): void {
        document.getElementById(modalId)?.classList.remove('active');
    }


    private static hideContactModal(): void {
        const modal = document.getElementById('contactModal');
        if (modal) {
            modal.classList.remove('active');
            this.clearFormErrors();
            this.currentContactId = null;
            this.hideGroupDropdown();
        }
    }


    static hideAllModals(): void {
        this.hideContactModal();
        this.hideModal('confirmModal');
        this.hideGroupsSidebar();
        this.hideGroupDropdown();
        this.cancelGroupEdit();
    }


    private static clearFormErrors(): void {
        document.querySelectorAll('.form-group__error').forEach(error => {
            error.classList.remove('active');
            error.textContent = '';
        });

        document.querySelectorAll('.form-group__input').forEach(input => {
            input.classList.remove('error');
        });
    }

    private static showFieldError(fieldId: string, message: string): void {
        const errorElement = document.getElementById(`${fieldId}Error`);
        const inputElement = document.getElementById(fieldId);

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('active');
        }

        if (inputElement) {
            inputElement.classList.add('error');
            inputElement.focus();
        }
    }

    private static async handleContactSubmit(): Promise<void> {
        try {
            const nameInput = document.getElementById('contactName') as HTMLInputElement;
            const phoneInput = document.getElementById('contactPhone') as HTMLInputElement;
            const groupInput = document.getElementById('contactGroup') as HTMLInputElement;

            const name = nameInput.value.trim();
            let phone = phoneInput.value.trim();
            const group = groupInput.value.trim();

            this.clearFormErrors();

            if (!name) {
                this.showFieldError('contactName', 'Введите имя контакта');
                return;
            }

            let phoneDigits = phone.replace(/\D/g, '');

            if (phoneDigits.startsWith('8')) {
                phoneDigits = '7' + phoneDigits.substring(1);
            }

            if (!phoneDigits.startsWith('7')) {
                phoneDigits = '7' + phoneDigits;
            }

            if (phoneDigits.length !== 11) {
                this.showFieldError('contactPhone', 'Введите полный номер телефона (11 цифр)');
                return;
            }

            phone = '+' + phoneDigits;

            if (!group) {
                this.showFieldError('contactGroup', 'Выберите группу');
                return;
            }

            try {
                if (this.currentContactId) {
                    const contacts = StorageManager.loadContacts();
                    const contact = contacts.find(c => c.id === this.currentContactId);

                    if (!contact) {
                        ToastManager.error('Контакт не найден');
                        return;
                    }

                    contact.update({ name, phone, group });
                    StorageManager.updateContact(contact);

                    ToastManager.success('Контакт успешно обновлен');
                } else {
                    const contact = new Contact(name, phone, group);
                    StorageManager.addContact(contact);

                    ToastManager.success('Контакт успешно создан');
                }

                this.hideContactModal();
                this.renderContacts();
                this.renderGroups();

            } catch (error) {
                console.error('Ошибка при сохранении контакта:', error);

                if (error instanceof Error) {
                    if (error.message.includes('Имя') || error.message.includes('имя')) {
                        this.showFieldError('contactName', error.message);
                    } else if (error.message.includes('номер') || error.message.includes('телефон') || error.message.includes('телефона')) {
                        this.showFieldError('contactPhone', error.message);
                    } else if (error.message.includes('Группа') || error.message.includes('группа')) {
                        this.showFieldError('contactGroup', error.message);
                    } else if (error.message.includes('уже существует')) {
                        this.showFieldError('contactPhone', 'Контакт с таким номером телефона уже существует');
                    } else {
                        ToastManager.error(error.message);
                    }
                } else {
                    ToastManager.error('Ошибка при сохранении контакта');
                }
            }

        } catch (error) {
            console.error('Общая ошибка при сохранении контакта:', error);
            ToastManager.error('Ошибка при сохранении контакта');
        }
    }

    private static confirmGroupDelete(): void {
        console.log('confirmGroupDelete called, groupToDelete:', this.groupToDelete);

        if (!this.groupToDelete) {
            console.error('No group to delete!');
            ToastManager.error('Ошибка: группа для удаления не указана');
            this.hideModal('confirmModal');
            return;
        }

        const groupIdToDelete = this.groupToDelete;
        console.log('Deleting group:', groupIdToDelete);

        try {
            const result = StorageManager.deleteGroup(groupIdToDelete);

            ToastManager.success(
                `Группа "${result.group.name}" и ${result.deletedContacts} контактов успешно удалены`
            );

            this.hideModal('confirmModal');

            this.groupToDelete = null;

            this.renderContacts();
            this.renderGroups();

            if (this.editingGroupId === groupIdToDelete) {
                this.cancelGroupEdit();
            }

        } catch (error) {
            console.error('Ошибка при удалении группы:', error);
            ToastManager.error(error instanceof Error ? error.message : 'Ошибка при удалении группы');
            this.hideModal('confirmModal');
            this.groupToDelete = null;
        }
    }

    private static deleteContact(contactId: string): void {
        if (!confirm('Вы уверены, что хотите удалить этот контакт?')) {
            return;
        }

        try {
            const deletedContact = StorageManager.deleteContact(contactId);

            if (deletedContact) {
                ToastManager.success('Контакт успешно удален');
                this.renderContacts();
                this.renderGroups();
            } else {
                ToastManager.error('Контакт не найден');
            }
        } catch (error) {
            console.error('Ошибка при удалении контакта:', error);
            ToastManager.error('Ошибка при удалении контакта');
        }
    }

    private static escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}