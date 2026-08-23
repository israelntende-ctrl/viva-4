/**
 * Term & Academic Year Archiving Service
 * Victory College School Clearance Portal
 * 
 * Provides:
 * 1. Snapshotting active clearance cohorts into immutable term archives
 * 2. Browsing and restoring historic term statistics and candidate records
 * 3. Rolling over academic terms while resetting candidate subject folios
 */

import { TermArchive, Learner, SchoolSettings } from '../types';
import { db, collection, doc, setDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp } from './firebase';

const ARCHIVES_COL = 'archives';

export class ArchiveService {
  /**
   * Snapshot current term clearance data into an archive record
   */
  static async createTermArchive(
    name: string,
    academicYear: string,
    term: string,
    learners: Learner[],
    archivedBy: string,
    remarks?: string
  ): Promise<TermArchive> {
    const archiveId = `arch_${academicYear.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}_${Date.now()}`;
    const clearedLearners = learners.filter((l) => l.subjects.every((s) => s.status === 'cleared')).length;
    const clearedRate = learners.length > 0 ? Math.round((clearedLearners / learners.length) * 100) : 0;

    const archiveRecord: TermArchive = {
      id: archiveId,
      name,
      academicYear,
      term,
      archivedAt: new Date().toISOString(),
      archivedBy,
      totalLearners: learners.length,
      clearedLearners,
      clearedRate,
      learnersSnapshot: JSON.parse(JSON.stringify(learners)),
      remarks,
    };

    try {
      const docRef = doc(db, ARCHIVES_COL, archiveId);
      await setDoc(docRef, {
        ...archiveRecord,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Saving archive locally due to Firestore fallback:', err);
      const existing = this.getLocalArchives();
      existing.unshift(archiveRecord);
      localStorage.setItem('vcs_term_archives', JSON.stringify(existing));
    }

    return archiveRecord;
  }

  /**
   * Retrieve cached local archives
   */
  static getLocalArchives(): TermArchive[] {
    try {
      const raw = localStorage.getItem('vcs_term_archives');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Listen to active term archives in Firestore
   */
  static subscribeToArchives(callback: (archives: TermArchive[]) => void): () => void {
    try {
      const q = query(collection(db, ARCHIVES_COL), orderBy('archivedAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          const archives = snapshot.docs.map((d) => d.data() as TermArchive);
          callback(archives.length > 0 ? archives : this.getLocalArchives());
        },
        (err) => {
          console.warn('Firestore archives error, using local:', err);
          callback(this.getLocalArchives());
        }
      );
    } catch {
      callback(this.getLocalArchives());
      return () => {};
    }
  }

  static subscribeArchives(callback: (archives: TermArchive[]) => void): () => void {
    return this.subscribeToArchives(callback);
  }
}
