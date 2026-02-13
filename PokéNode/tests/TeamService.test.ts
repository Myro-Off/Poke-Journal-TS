import { describe, it, expect, beforeEach } from "bun:test";
import { TeamService } from '../src/services/TeamService';

describe('TeamService', () => {

    beforeEach(() => {
        localStorage.clear();
        
        // @ts-ignore
        TeamService._isLoaded = false;
        // @ts-ignore
        TeamService._teams = [];
    });

    it('doit créer une nouvelle équipe avec 6 slots', () => {
        const teamName = 'God Squad';
        TeamService.createTeam(teamName);
        
        const teams = TeamService.getAllTeams();
        const createdTeam = teams.find(t => t.name === teamName);
        
        expect(createdTeam).toBeDefined();
        // Vérifie qu'on a bien nos 6 places pour l'équipe finale
        expect(createdTeam?.members.length).toBe(6);
    });

    it('doit pouvoir renommer une équipe', () => {
        const team = TeamService.createTeam('Initial');
        if (!team) throw new Error("Team non créée");
        
        TeamService.renameTeam(team.id, 'Elite Four Killer');
        
        const updatedTeam = TeamService.getTeamById(team.id);
        expect(updatedTeam?.name).toBe('Elite Four Killer');
    });

    it('doit supprimer une équipe', () => {
        const team = TeamService.createTeam('A supprimer');
        const id = team!.id;
        
        TeamService.deleteTeam(id);
        
        const deletedTeam = TeamService.getTeamById(id);
        expect(deletedTeam).toBeUndefined();
    });
});