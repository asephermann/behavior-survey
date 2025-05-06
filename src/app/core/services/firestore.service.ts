import { Injectable } from '@angular/core';
import {
  Firestore, collection, doc, getDocs, updateDoc, collectionData
} from '@angular/fire/firestore';
// import { collectionGroup, query, where } from 'firebase/firestore';
// import { docData } from 'rxfire/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  constructor(private firestore: Firestore) {}

  getKelasList() {
    const ref = collection(this.firestore, 'kelas');
    return getDocs(ref);
  }

  getSiswaByKelas(kelasId: string) {
    const siswaRef = collection(this.firestore, `kelas/${kelasId}/siswa`);
    return getDocs(siswaRef);
  }

  updateJawabanSiswa(kelasId: string, siswaId: string, jawaban: string) {
    const siswaRef = doc(this.firestore, `kelas/${kelasId}/siswa/${siswaId}`);
    return updateDoc(siswaRef, { jawaban });
  }
}
