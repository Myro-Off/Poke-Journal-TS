import type { Team, TeamMember, PokemonLite, MoveLite } from '../types/model';
import { PaperNotification } from '../components/common/PaperNotification';
import { I18n } from './I18n';

const STORAGE_KEY = 'pokepedia_teams_v1';
const MAX_TEAMS_ALLOWED = 6;
const DEFAULT_TEAM_NAME = "???";

export class TeamService {

    private static _teams: Team[] = [];
    private static _isLoaded = false;

    // #region LECTURE DE DONNÉES
    // ============================================================================

    static getAllTeams(): Team[] {
        this.loadFromStorageIfNeeded();
        return [...this._teams];
    }

    static getTeamById(id: string): Team | undefined {
        this.loadFromStorageIfNeeded();
        return this._teams.find(team => team.id === id);
    }
    // #endregion

    // #region GESTION DES ÉQUIPES
    // ============================================================================

    static createTeam(name: string): Team | null {
        this.loadFromStorageIfNeeded();

        if (this.hasReachedTeamLimit()) {
            PaperNotification.show(I18n.getText('team_limit'), 'alert');
            return null;
        }

        const newTeam = this.generateEmptyTeam(name);
        this._teams.push(newTeam);
        this.saveToStorage();
        
        return newTeam;
    }

    static renameTeam(teamId: string, newName: string): void {
        const team = this.getTeamById(teamId);
        if (team) {
            team.name = newName || DEFAULT_TEAM_NAME;
            this.saveToStorage();
        }
    }

    static deleteTeam(teamId: string): void {
        this.loadFromStorageIfNeeded();
        this._teams = this._teams.filter(team => team.id !== teamId);

        if (this._teams.length === 0) {
            this._teams.push(this.generateEmptyTeam(DEFAULT_TEAM_NAME));
        }
        
        this.saveToStorage();
    }
    // #endregion

    // #region GESTION DES POKÉMON (SLOTS)
    // ============================================================================

    static updateMember(teamId: string, slotIndex: number, data: PokemonLite | TeamMember): void {
        const team = this.getTeamById(teamId);
        
        if (!team || !this.isValidSlotIndex(slotIndex)) return;

        team.members[slotIndex] = this.buildTeamMember(data);
        this.saveToStorage();
    }

    static clearSlot(teamId: string, slotIndex: number): void {
        const team = this.getTeamById(teamId);

        if (team && this.isValidSlotIndex(slotIndex)) {
            team.members[slotIndex] = null;
            this.saveToStorage();
        }
    }
    // #endregion

    // #region PERSISTANCE & CHARGEMENT
    // ============================================================================

    private static loadFromStorageIfNeeded(): void {
        if (this._isLoaded) return;

        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            this._teams = savedData ? JSON.parse(savedData) : [];
            
            if (this._teams.length === 0) {
                this._teams.push(this.generateEmptyTeam(DEFAULT_TEAM_NAME));
            }
        } catch (error) {
            console.error(I18n.getText('save_error'), error);
            this._teams = [this.generateEmptyTeam(DEFAULT_TEAM_NAME)];
        }

        this._isLoaded = true;
    }

    private static saveToStorage(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._teams));
        window.dispatchEvent(new CustomEvent('teams:updated'));
    }
    // #endregion

    // #region UTILITAIRES
    // ============================================================================

    private static generateEmptyTeam(name: string): Team {
        return {
            id: crypto.randomUUID(),
            name: name,
            members: [null, null, null, null, null, null]
        };
    }

    private static buildTeamMember(data: PokemonLite | TeamMember): TeamMember {
        const moves = this.extractMoves(data);
        const stats = 'stats' in data ? (data as TeamMember).stats : undefined;

        return {
            ...data,
            selectedMoves: moves,
            stats: stats
        };
    }

    private static extractMoves(data: PokemonLite | TeamMember): [MoveLite | null, MoveLite | null, MoveLite | null, MoveLite | null] {
        if ('selectedMoves' in data && Array.isArray(data.selectedMoves)) {
            return data.selectedMoves;
        }
        return [null, null, null, null];
    }

    private static hasReachedTeamLimit(): boolean {
        return this._teams.length >= MAX_TEAMS_ALLOWED;
    }

    private static isValidSlotIndex(index: number): boolean {
        return index >= 0 && index <= 5;
    }
    // #endregion
}