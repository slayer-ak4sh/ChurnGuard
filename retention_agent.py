"""
Retention Recommendation Agent
Rule-based + template-driven personalized retention offer generator.
Acts as an AI agent that analyzes customer profile and churn risk,
then recommends targeted interventions.
"""

from dataclasses import dataclass
from typing import List, Dict


@dataclass
class RetentionRecommendation:
    priority: str          # HIGH / MEDIUM / LOW
    category: str          # Discount / Upgrade / Support / Loyalty
    action: str            # Short action title
    description: str       # Detailed recommendation
    expected_impact: str   # Expected churn reduction


class RetentionAgent:
    """
    AI Retention Agent that generates personalized recommendations
    based on customer profile and churn probability.
    """

    def analyze(self, customer: Dict, churn_prob: float) -> Dict:
        recommendations = []
        risk_level = self._risk_level(churn_prob)
        reasons = self._identify_churn_drivers(customer, churn_prob)
        recommendations = self._generate_recommendations(customer, churn_prob, reasons)

        return {
            "risk_level": risk_level,
            "churn_probability": round(churn_prob * 100, 1),
            "churn_drivers": reasons,
            "recommendations": [r.__dict__ for r in recommendations],
            "retention_message": self._personalized_message(customer, risk_level, recommendations),
            "estimated_cltv": self._estimate_cltv(customer),
        }

    def _risk_level(self, prob: float) -> str:
        if prob >= 0.7:
            return "HIGH"
        elif prob >= 0.4:
            return "MEDIUM"
        return "LOW"

    def _identify_churn_drivers(self, c: Dict, prob: float) -> List[str]:
        drivers = []
        if c.get("Contract") == "Month-to-month":
            drivers.append("No long-term contract commitment")
        if c.get("tenure", 0) < 12:
            drivers.append("New customer (low tenure)")
        if c.get("MonthlyCharges", 0) > 70:
            drivers.append("High monthly charges")
        if c.get("InternetService") == "Fiber optic" and not c.get("OnlineSecurity"):
            drivers.append("Fiber optic without security add-ons")
        if not c.get("TechSupport"):
            drivers.append("No tech support subscription")
        if c.get("PaymentMethod") == "Electronic check":
            drivers.append("Using electronic check (higher churn segment)")
        if not c.get("Partner") and not c.get("Dependents"):
            drivers.append("Single customer (no household ties)")
        if prob >= 0.7 and not drivers:
            drivers.append("Multiple combined risk factors")
        return drivers or ["General dissatisfaction risk"]

    def _generate_recommendations(self, c: Dict, prob: float, reasons: List[str]) -> List[RetentionRecommendation]:
        recs = []
        monthly = c.get("MonthlyCharges", 50)
        tenure = c.get("tenure", 0)

        # Contract upgrade offer
        if c.get("Contract") == "Month-to-month":
            discount = 20 if prob >= 0.7 else 10
            recs.append(RetentionRecommendation(
                priority="HIGH",
                category="Contract Upgrade",
                action=f"Offer {discount}% discount for 1-year contract",
                description=f"Customer is on month-to-month plan — highest churn risk segment. "
                             f"Offer {discount}% off monthly bill (${round(monthly * discount/100, 2)}/mo savings) "
                             f"for switching to a 1-year contract.",
                expected_impact="Reduces churn risk by ~35%"
            ))

        # Loyalty reward for long-tenure customers
        if tenure >= 24:
            recs.append(RetentionRecommendation(
                priority="MEDIUM",
                category="Loyalty Reward",
                action="Loyalty bonus: free service upgrade",
                description=f"Customer has been with us for {tenure} months. "
                             f"Offer a free upgrade (e.g., streaming bundle or speed boost) "
                             f"as a loyalty reward to reinforce retention.",
                expected_impact="Increases satisfaction score by ~20%"
            ))

        # Tech support upsell
        if not c.get("TechSupport") and c.get("InternetService") != "No":
            recs.append(RetentionRecommendation(
                priority="HIGH" if prob >= 0.6 else "MEDIUM",
                category="Service Upgrade",
                action="Offer 3 months free TechSupport",
                description="Customer lacks tech support. Proactively offer 3 months free TechSupport "
                             "to improve experience and reduce frustration-driven churn.",
                expected_impact="Reduces churn risk by ~15%"
            ))

        # Security bundle for fiber customers
        if c.get("InternetService") == "Fiber optic" and not c.get("OnlineSecurity"):
            recs.append(RetentionRecommendation(
                priority="MEDIUM",
                category="Bundle Offer",
                action="Security + Backup bundle at 50% off",
                description="Fiber optic customers without security add-ons churn more. "
                             "Offer Online Security + Online Backup bundle at 50% off for 6 months.",
                expected_impact="Reduces churn risk by ~12%"
            ))

        # Payment method switch incentive
        if c.get("PaymentMethod") == "Electronic check":
            recs.append(RetentionRecommendation(
                priority="LOW",
                category="Payment Incentive",
                action="$5/mo discount for auto-pay enrollment",
                description="Electronic check users have higher churn rates. "
                             "Offer $5/month discount for switching to automatic bank transfer or credit card.",
                expected_impact="Reduces churn risk by ~8%"
            ))

        # High bill discount
        if monthly > 80 and prob >= 0.5:
            recs.append(RetentionRecommendation(
                priority="HIGH",
                category="Discount",
                action=f"Personalized bill reduction: save ${round(monthly * 0.15, 2)}/mo",
                description=f"Customer's monthly bill of ${monthly} is above average. "
                             f"Offer a 15% bill credit for 3 months to reduce price sensitivity.",
                expected_impact="Reduces churn risk by ~20%"
            ))

        # New customer onboarding
        if tenure < 6:
            recs.append(RetentionRecommendation(
                priority="HIGH",
                category="Onboarding",
                action="Assign dedicated onboarding specialist",
                description="Customer is in the critical first 6 months. "
                             "Assign a dedicated customer success rep for proactive check-ins "
                             "and ensure smooth onboarding experience.",
                expected_impact="Reduces early churn by ~25%"
            ))

        # Sort by priority
        priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        recs.sort(key=lambda r: priority_order.get(r.priority, 3))
        return recs[:4]  # Top 4 recommendations

    def _personalized_message(self, c: Dict, risk: str, recs: List) -> str:
        name_hint = "Valued Customer"
        top_action = recs[0].action if recs else "a personalized offer"
        tenure = c.get("tenure", 0)
        monthly = c.get("MonthlyCharges", 0)

        if risk == "HIGH":
            return (f"⚠️ {name_hint}, we've noticed you might be considering other options. "
                    f"As a customer for {tenure} months spending ${monthly}/mo, you're important to us. "
                    f"We'd love to offer you: {top_action}. Let's talk!")
        elif risk == "MEDIUM":
            return (f"👋 {name_hint}, thank you for being with us for {tenure} months! "
                    f"We have a special offer just for you: {top_action}.")
        else:
            return (f"🌟 {name_hint}, you're one of our valued customers! "
                    f"Enjoy exclusive benefits: {top_action}.")

    def _estimate_cltv(self, c: Dict) -> float:
        """Estimate Customer Lifetime Value based on survival probability heuristic."""
        monthly = c.get("MonthlyCharges", 50)
        tenure = c.get("tenure", 1)
        contract = c.get("Contract", "Month-to-month")
        base_months = {"Month-to-month": 18, "One year": 36, "Two year": 60}
        expected_months = base_months.get(contract, 18) + tenure * 0.3
        return round(monthly * expected_months, 2)
