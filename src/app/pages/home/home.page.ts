import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonSearchbar, Platform } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { ChatPage } from "../chat/chat.page";

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule, ChatPage]
})
export class HomePage implements OnInit {
  @ViewChild('searchbar') searchbar!: IonSearchbar;
  isDesktop = false;

  kelasList = signal<{ id: string; nama: string; guru: string; color: string }[]>([]);
  searchQuery = signal('');
  isSearching = signal(false);
  selectedKelas: { id: string; nama: string; guru: string; color: string } | null = null;

  constructor(private firestore: FirestoreService, private platform: Platform, private router: Router) {
    this.isDesktop = platform.width() >= 768;
    platform.resize.subscribe(() => {
      this.isDesktop = platform.width() >= 768;
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.selectedKelas) {
        this.clearSelection();
      }
    });
  }

  async ngOnInit() {
    const snapshot = await this.firestore.getKelasList();
    const list = snapshot.docs.map((doc, i) => ({
      id: doc.id,
      color: this.getColor(i),
      ...doc.data()
    })) as { id: string; nama: string; guru: string; color: string }[];
    this.kelasList.set(list);
  }

  toggleSearch() {
    this.isSearching.set(true);

    setTimeout(() => {
      this.searchbar?.setFocus();
    }, 300);
  }
  onCancelSearch() {
    this.searchQuery.set('');
    this.isSearching.set(false);
  }

  filteredKelas = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.kelasList();
    return this.kelasList().filter(k =>
      k.nama.toLowerCase().includes(q) || k.guru.toLowerCase().includes(q)
    );
  });

  getInisial(nama: string): string {
    return nama.slice(0, 2).toUpperCase();
  }

  getColor(index: number): string {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#3f51b5',
      '#2196f3', '#009688', '#4caf50', '#ff9800',
      '#795548', '#607d8b', '#00bcd4', '#673ab7'
    ];
    return colors[index % colors.length];
  }

  selectKelas(kelas: any) {
    if (this.isDesktop) {
      this.selectedKelas = kelas;
    } else {
      this.router.navigate(['/chat', kelas.id], {
        state: {
          nama: kelas.nama,
          guru: kelas.guru,
          color: kelas.color
        }
      });
    }
  }

  clearSelection() {
    this.selectedKelas = null;
  }
}