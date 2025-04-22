import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/hero5-header'
import BackButton from '@/components/back-button'

export default function DisclaimerPolicy() {
  return (
    <>
      <HeroHeader />
      <div className="bg-black min-h-screen">
        <BackButton />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8 font-mono uppercase">DISCLAIMER_POLICY</h1>
          
          <div className="max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">TRADING_RISK_DISCLAIMER</h2>
              <p className="text-gray-300 font-mono uppercase">
                FUTURES_STOCKS_AND_OPTIONS_TRADING_CARRY_A_SIGNIFICANT_RISK_OF_LOSS_AND_MAY_NOT_BE_SUITABLE_FOR_ALL_INVESTORS._AT_ALGOZ.COM_WE_SOLELY_PROVIDE_AUTOMATION_TRADING_TOOLS_AND_A_STRATEGY_MARKETPLACE_WE_DO_NOT_OFFER_TRADING_BUY_OR_SELL_SIGNALS_RECOMMENDATIONS_OR_ANY_FORM_OF_INVESTMENT_ADVISORY_SERVICES.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                THE_USE_OF_OUR_TRADING_STRATEGIES_IS_AT_YOUR_OWN_RISK_AND_ALGOZ.COM_CANNOT_BE_HELD_RESPONSIBLE_FOR_ANY_LOSSES_INCURRED_DURING_THEIR_IMPLEMENTATION._WE_ADVISE_USERS_TO_EXERCISE_CAUTION_AND_PERFORM_THEIR_DUE_DILIGENCE_BEFORE_ENGAGING_IN_ANY_TRADING_ACTIVITIES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">NO_INVESTMENT_ADVICE</h2>
              <p className="text-gray-300 font-mono uppercase">
                THE_INFORMATION_PROVIDED_ON_ALGOZ_IS_FOR_GENERAL_INFORMATIONAL_PURPOSES_ONLY_AND_SHOULD_NOT_BE_CONSTRUED_AS_INVESTMENT_ADVICE._WE_DO_NOT_PROVIDE_PERSONALIZED_INVESTMENT_RECOMMENDATIONS_OR_ACT_AS_A_FINANCIAL_ADVISOR.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                ANY_DECISIONS_YOU_MAKE_REGARDING_INVESTMENTS_TRADING_STRATEGIES_OR_FINANCIAL_MATTERS_SHOULD_BE_BASED_ON_YOUR_OWN_RESEARCH_JUDGMENT_AND_CONSULTATION_WITH_QUALIFIED_FINANCIAL_PROFESSIONALS.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">THIRD-PARTY_CONTENT</h2>
              <p className="text-gray-300 font-mono uppercase">
                ALGOZ_MAY_INCLUDE_CONTENT_TOOLS_OR_STRATEGIES_CREATED_BY_THIRD_PARTIES._WE_DO_NOT_ENDORSE_GUARANTEE_OR_ASSUME_RESPONSIBILITY_FOR_ANY_THIRD-PARTY_CONTENT_AVAILABLE_THROUGH_OUR_PLATFORM.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                USERS_SHOULD_EVALUATE_ALL_INFORMATION_OPINIONS_AND_STRATEGIES_CRITICALLY_BEFORE_IMPLEMENTATION.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">PAST_PERFORMANCE</h2>
              <p className="text-gray-300 font-mono uppercase">
                PAST_PERFORMANCE_OF_ANY_TRADING_STRATEGY_ALGORITHM_OR_SYSTEM_IS_NOT_INDICATIVE_OF_FUTURE_RESULTS._THE_FINANCIAL_MARKETS_ARE_INHERENTLY_UNPREDICTABLE_AND_NO_TRADING_SYSTEM_CAN_GUARANTEE_PROFITS.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                ANY_EXAMPLES_DEMONSTRATIONS_OR_SIMULATIONS_OF_TRADING_STRATEGIES_SHOWN_ON_OUR_PLATFORM_REPRESENT_HISTORICAL_DATA_AND_SHOULD_NOT_BE_INTERPRETED_AS_A_PROMISE_OR_GUARANTEE_OF_FUTURE_PERFORMANCE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">USER_RESPONSIBILITY</h2>
              <p className="text-gray-300 font-mono uppercase">
                BY_USING_ALGOZ_YOU_ACKNOWLEDGE_AND_AGREE_THAT_YOU_ARE_SOLELY_RESPONSIBLE_FOR_YOUR_TRADING_DECISIONS_AND_ANY_RESULTING_FINANCIAL_OUTCOMES._YOU_SHOULD_ONLY_INVEST_OR_RISK_MONEY_THAT_YOU_CAN_AFFORD_TO_LOSE.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                WE_STRONGLY_RECOMMEND_CONSULTING_WITH_A_QUALIFIED_FINANCIAL_ADVISOR_BEFORE_MAKING_ANY_INVESTMENT_DECISIONS_ESPECIALLY_IF_YOU_ARE_INEXPERIENCED_IN_TRADING_OR_UNFAMILIAR_WITH_THE_FINANCIAL_MARKETS.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 text-center">
            <Button asChild variant="outline" className="text-blue-400 hover:text-blue-300 border-blue-900 hover:border-blue-800 font-mono uppercase">
              <Link href="/">
                RETURN_TO_HOME
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
} 