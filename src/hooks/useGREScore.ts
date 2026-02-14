
import { useQuery } from "@tanstack/react-query";
import { ALL_MODULES } from "@/data/greSimulator"; // For MVP we use the static data, later we fetch from DB
import { GREModule } from "@/types/gre";

export function useGREScore() {
    // In a real app, this would fetch status from 'gre_assessments' table
    // For now, we simulate dynamic status based on local state or just use the static mock

    const modules = ALL_MODULES;

    const totalCritical = modules.filter(m => m.risk_level === 'critical').length;
    const completedCritical = modules.filter(m => m.risk_level === 'critical' && m.status === 'completed').length;

    const totalHigh = modules.filter(m => m.risk_level === 'high').length;
    const completedHigh = modules.filter(m => m.risk_level === 'high' && m.status === 'completed').length;

    // Weighted Score Calculation
    // Critical = 3 points, High = 2 points, Medium = 1 point
    const calculateWeightedScore = () => {
        let totalPoints = 0;
        let earnedPoints = 0;

        modules.forEach(m => {
            let weight = 0;
            if (m.risk_level === 'critical') weight = 3;
            else if (m.risk_level === 'high') weight = 2;
            else if (m.risk_level === 'medium') weight = 1;
            else weight = 0.5; // Low risk

            totalPoints += weight;
            if (m.status === 'completed') earnedPoints += weight;
            else if (m.status === 'pending') earnedPoints += weight * 0.2; // Partial credit for starting
        });

        return totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
    };

    const overallScore = calculateWeightedScore();

    // Risk Analysis
    const criticalMissing = modules.filter(m => m.risk_level === 'critical' && m.status !== 'completed');
    const highMissing = modules.filter(m => m.risk_level === 'high' && m.status !== 'completed');

    return {
        overallScore,
        criticalRisksCount: criticalMissing.length,
        highRisksCount: highMissing.length,
        totalModules: modules.length,
        completedModules: modules.filter(m => m.status === 'completed').length,
        criticalMissing,
        highMissing
    };
}
