import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, Platform } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from 'src/app/core/services/firestore.service';

@Component({
    standalone: true,
    selector: 'app-chat',
    templateUrl: './chat.page.html',
    styleUrls: ['./chat.page.scss'],
    imports: [CommonModule, IonicModule, FormsModule]
})
export class ChatPage {
    @ViewChild(IonContent) content!: IonContent;
    isDesktop = false;

    kelasId = this.route.snapshot.paramMap.get('id') ?? '';
    kelasNama = '';
    guruNama = '';
    avatarColor = '#ccc';

    siswaList = signal<{ id: string; nama: string; jawaban: string | null }[]>([]);
    currentIndex = signal(0);
    inputJawaban: string = '';
    isEditing = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private firestore: FirestoreService,
        private platform: Platform
    ) {
        this.isDesktop = platform.is('desktop');
        const nav = this.router.getCurrentNavigation();
        const state = nav?.extras?.state;

        this.kelasNama = state?.['nama'] ?? this.kelasId;
        this.guruNama = state?.['guru'] ?? '';
        this.avatarColor = state?.['color'] ?? '#ccc';

        this.loadSiswa();

        this.platform.backButton.subscribeWithPriority(10, () => {
            if (this.isEditing) {
                this.cancelEdit();
            }
        });
    }

    getInisial(nama: string): string {
        return nama.split(' ')[0] || '?';
    }

    cancelEdit() {
        this.isEditing = false;
        this.inputJawaban = '';
    }

    async loadSiswa() {
        const snapshot = await this.firestore.getSiswaByKelas(this.kelasId);
        const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as { id: string; nama: string; jawaban: string | null }[];

        // Urutkan jika perlu
        list.sort((a, b) => a.nama.localeCompare(b.nama));
        this.siswaList.set(list);

        // Cari index siswa pertama yang belum dijawab
        const firstUnansweredIndex = list.findIndex(siswa => !siswa.jawaban);

        // Jika semua sudah dijawab, index jadi panjang list
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

        await this.firestore.updateJawabanSiswa(this.kelasId, siswa.id, this.inputJawaban);

        const updated = [...this.siswaList()];
        updated[this.currentIndex()].jawaban = this.inputJawaban;
        this.siswaList.set(updated);

        this.inputJawaban = '';

        // Cari siswa pertama yang belum dijawab
        const nextIndex = updated.findIndex(s => !s.jawaban);

        if (nextIndex === -1) {
            // Semua sudah dijawab
            this.currentIndex.set(updated.length);
        } else {
            this.currentIndex.set(nextIndex);
        }

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
        if (!this.isDesktop) return; // hanya aktif di desktop

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Cegah baris baru
            if (this.inputJawaban.trim()) {
                this.send();
            }
        }
    }

    handleBack() {
        if (this.isEditing) {
            this.cancelEdit();
        } else {
            history.back();
        }
    }

    formatJawaban(text: string | null): string {
        return (text || '').replace(/\n/g, '<br>');
      }
      
}
