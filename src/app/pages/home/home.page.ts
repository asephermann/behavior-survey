import { Component, OnInit, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonSearchbar } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from 'src/app/core/services/firestore.service';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class HomePage implements OnInit {
  @ViewChild('searchbar') searchbar!: IonSearchbar;
  kelasList = signal<{ id: string; nama: string; guru: string }[]>([]);
  searchQuery = signal('');
  isSearching = signal(false);

  constructor(private firestore: FirestoreService) { }

  async ngOnInit() {
    const snapshot = await this.firestore.getKelasList();
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as { id: string; nama: string, guru: string }[];
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
    return nama.split(' ')[0]; // atau ambil 2 huruf depan: nama.slice(0, 2).toUpperCase()
  }

  getColor(index: number): string {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#3f51b5',
      '#2196f3', '#009688', '#4caf50', '#ff9800',
      '#795548', '#607d8b', '#00bcd4', '#673ab7'
    ];
    return colors[index % colors.length];
  }

}
