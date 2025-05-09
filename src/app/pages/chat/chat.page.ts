import { Component, Input, Output, EventEmitter, signal, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, Platform } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from 'src/app/core/services/firestore.service';

@Component({
    standalone: true,
    selector: 'app-chat',
    templateUrl: './chat.page.html',
    styleUrls: ['./chat.page.scss'],
    imports: [CommonModule, IonicModule, FormsModule],
    host: {
        '[style.display]': "'flex'",
        '[style.flex]': "'1 1 0%'",
        '[style.flexDirection]': "'column'",
        '[style.height]': "'100%'"
    }
})
export class ChatPage implements OnChanges {
    @ViewChild(IonContent) content!: IonContent;
    @ViewChild('textareaInput') textareaInput: any;

    @Input() kelasId?: string;
    @Input() kelasNama: string = '';
    @Input() guruNama: string = '';
    @Input() avatarColor?: string;
    @Output() closed = new EventEmitter<void>();

    siswaList = signal<{ id: string; nama: string; jawaban: string | null }[]>([]);
    currentIndex = signal(0);
    inputJawaban: string = '';
    isEditing = false;
    isDesktop = false;

    constructor(
        private firestore: FirestoreService,
        private platform: Platform,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.isDesktop = platform.is('desktop');

        if (!this.kelasId) {
            const idFromRoute = this.route.snapshot.paramMap.get('id');
            if (idFromRoute) this.kelasId = idFromRoute;

            const nav = this.router.getCurrentNavigation();
            const state = nav?.extras?.state;
            this.kelasNama = state?.['nama'] ?? this.kelasId;
            this.guruNama = state?.['guru'] ?? '';
            this.avatarColor = state?.['color'] ?? '#ccc';
        }

        this.platform.backButton.subscribeWithPriority(10, () => {
            if (this.isEditing) {
                this.cancelEdit();
            } else if (this.isDesktop) {
                this.closed.emit();
            }
        });
    }

    ngOnInit() {
        if (this.kelasId) {
            this.loadSiswa().then(() => {
                setTimeout(() => {
                    this.content?.scrollToBottom(300);
                    this.textareaInput?.setFocus();
                }, 150);
            });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['kelasId'] && !changes['kelasId'].firstChange) {
            this.loadSiswa().then(() => {
                this.inputJawaban = '';
                this.isEditing = false;

                this.content?.scrollToBottom(300);
                this.textareaInput?.setFocus();
            });
        }
    }

    getInisial(nama: string): string {
        return nama.split(' ')[0] || '?';
    }

    cancelEdit() {
        this.isEditing = false;
        this.inputJawaban = '';
    }

    async loadSiswa() {
        const snapshot = await this.firestore.getSiswaByKelas(this.kelasId!);
        const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as { id: string; nama: string; jawaban: string | null }[];

        list.sort((a, b) => a.nama.localeCompare(b.nama));
        this.siswaList.set(list);

        const firstUnansweredIndex = list.findIndex(siswa => !siswa.jawaban);
        const indexToSet = firstUnansweredIndex !== -1 ? firstUnansweredIndex : list.length;
        this.currentIndex.set(indexToSet);
    }

    get currentSiswa() {
        return this.siswaList()[this.currentIndex()];
    }

    isLastStudent(): boolean {
        return this.currentIndex() >= this.siswaList().length;
    }

    async send() {
        const siswa = this.currentSiswa;
        await this.firestore.updateJawabanSiswa(this.kelasId!, siswa.id, this.inputJawaban);

        const updated = [...this.siswaList()];
        updated[this.currentIndex()].jawaban = this.inputJawaban;
        this.siswaList.set(updated);

        this.inputJawaban = '';
        const nextIndex = updated.findIndex(s => !s.jawaban);
        this.currentIndex.set(nextIndex !== -1 ? nextIndex : updated.length);

        this.isEditing = false;
        setTimeout(() => {
            this.content?.scrollToBottom(300);
        }, 100);
    }

    edit(index: number) {
        this.currentIndex.set(index);
        this.inputJawaban = this.siswaList()[index].jawaban ?? '';
        this.isEditing = true;
    }

    onKeydown(event: KeyboardEvent) {
        if (!this.isDesktop) return;
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (this.inputJawaban.trim()) {
                this.send();
            }
        }
    }

    formatJawaban(text: string | null): string {
        return (text || '').replace(/\n/g, '<br>');
    }
}
