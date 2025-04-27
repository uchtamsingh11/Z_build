import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/hero5-header'
import BackButton from '@/components/back-button'

export default function CookiesPolicy() {
  return (
    <>
      <HeroHeader />
      <div className="bg-black min-h-screen">
        <BackButton />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8 font-mono uppercase">COOKIES_POLICY</h1>
          
          <div className="max-w-none">
            <section className="mb-8">
              <p className="text-gray-300 font-mono uppercase">
                EFFECTIVE_DATE: JUNE_15,_2024
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                WELCOME_TO_ALGOZ_("WE",_"US",_OR_"OUR").
                THIS_COOKIES_POLICY_EXPLAINS_HOW_WE_USE_COOKIES_AND_SIMILAR_TECHNOLOGIES_ON_OUR_ALGO_TRADING_PLATFORM_("THE_WEBSITE").
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                BY_CONTINUING_TO_USE_OUR_WEBSITE,_YOU_AGREE_TO_THE_USE_OF_COOKIES_AS_DESCRIBED_IN_THIS_POLICY.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">WHAT_ARE_COOKIES?</h2>
              <p className="text-gray-300 font-mono uppercase">
                COOKIES_ARE_SMALL_TEXT_FILES_STORED_ON_YOUR_DEVICE_WHEN_YOU_VISIT_A_WEBSITE._THEY_HELP_WEBSITES_REMEMBER_INFORMATION_ABOUT_YOUR_VISIT,_SUCH_AS_YOUR_PREFERRED_SETTINGS_AND_LOGIN_STATUS,_AND_CAN_ENHANCE_YOUR_OVERALL_BROWSING_EXPERIENCE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">HOW_WE_USE_COOKIES</h2>
              <p className="text-gray-300 font-mono uppercase">
                WE_USE_COOKIES_ON_ALGOZ_FOR_THE_FOLLOWING_PURPOSES:
              </p>
              <ul className="list-disc pl-6 text-gray-300 font-mono uppercase">
                <li>
                  <strong>AUTHENTICATION_AND_SECURITY:</strong>
                  <p className="mt-1">TO_RECOGNIZE_YOU_WHEN_YOU_LOG_IN_AND_KEEP_YOUR_ACCOUNT_SECURE.</p>
                </li>
                <li className="mt-4">
                  <strong>PREFERENCES_AND_SETTINGS:</strong>
                  <p className="mt-1">TO_REMEMBER_YOUR_PREFERENCES_(SUCH_AS_LANGUAGE_SELECTION,_SAVED_BROKER_API_KEYS,_OR_TRADING_SETTINGS).</p>
                </li>
                <li className="mt-4">
                  <strong>PERFORMANCE_AND_ANALYTICS:</strong>
                  <p className="mt-1">TO_UNDERSTAND_HOW_USERS_INTERACT_WITH_OUR_WEBSITE,_SO_WE_CAN_IMPROVE_FUNCTIONALITY_AND_USER_EXPERIENCE.</p>
                  <p className="mt-1">(EXAMPLE:_TRACKING_THE_MOST_USED_FEATURES,_POPULAR_TRADING_TOOLS,_OR_MONITORING_SYSTEM_PERFORMANCE.)</p>
                </li>
                <li className="mt-4">
                  <strong>MARKETING_AND_COMMUNICATION:</strong>
                  <p className="mt-1">TO_OCCASIONALLY_DISPLAY_RELEVANT_UPDATES_OR_PROMOTIONAL_CONTENT_BASED_ON_YOUR_ACTIVITY_ON_THE_PLATFORM_(IF_APPLICABLE).</p>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">TYPES_OF_COOKIES_WE_USE</h2>
              <ul className="list-disc pl-6 text-gray-300 font-mono uppercase">
                <li>
                  <strong>ESSENTIAL_COOKIES:</strong>
                  <p className="mt-1">THESE_ARE_NECESSARY_FOR_BASIC_FUNCTIONALITY_LIKE_LOGGING_INTO_YOUR_ACCOUNT_AND_ACCESSING_SECURE_AREAS.</p>
                </li>
                <li className="mt-4">
                  <strong>FUNCTIONAL_COOKIES:</strong>
                  <p className="mt-1">THESE_HELP_ENHANCE_YOUR_EXPERIENCE_BY_REMEMBERING_YOUR_SETTINGS_AND_PREFERENCES.</p>
                </li>
                <li className="mt-4">
                  <strong>ANALYTICS_COOKIES:</strong>
                  <p className="mt-1">THESE_HELP_US_COLLECT_ANONYMOUS_USAGE_DATA,_ALLOWING_US_TO_IMPROVE_OUR_SERVICES.</p>
                </li>
                <li className="mt-4">
                  <strong>THIRD-PARTY_COOKIES:</strong>
                  <p className="mt-1">WE_MAY_USE_TRUSTED_THIRD-PARTY_SERVICES_(LIKE_GOOGLE_ANALYTICS,_PAYMENT_PROVIDERS,_OR_BROKER_APIS)_THAT_ALSO_PLACE_COOKIES_TO_SUPPORT_ANALYTICS_OR_PAYMENT_PROCESSING.</p>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">MANAGING_COOKIES</h2>
              <p className="text-gray-300 font-mono uppercase">
                YOU_CAN_CONTROL_AND_MANAGE_COOKIES_THROUGH_YOUR_BROWSER_SETTINGS.
                MOST_BROWSERS_ALLOW_YOU_TO:
              </p>
              <ul className="list-disc pl-6 text-gray-300 font-mono uppercase">
                <li>VIEW_COOKIES_STORED_ON_YOUR_DEVICE</li>
                <li>DELETE_COOKIES</li>
                <li>BLOCK_COOKIES_FROM_SPECIFIC_SITES</li>
                <li>BLOCK_ALL_COOKIES_FROM_BEING_SET</li>
              </ul>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                PLEASE_NOTE_THAT_IF_YOU_CHOOSE_TO_DISABLE_OR_BLOCK_COOKIES,_SOME_FEATURES_OF_OUR_WEBSITE_MAY_NOT_WORK_AS_INTENDED.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                FOR_MORE_INFORMATION_ON_HOW_TO_MANAGE_YOUR_COOKIES,_VISIT:
                ALL_ABOUT_COOKIES
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">CHANGES_TO_THIS_COOKIES_POLICY</h2>
              <p className="text-gray-300 font-mono uppercase">
                WE_MAY_UPDATE_THIS_COOKIES_POLICY_FROM_TIME_TO_TIME_TO_REFLECT_CHANGES_IN_TECHNOLOGY,_LEGISLATION,_OR_OUR_SERVICES.
                ANY_CHANGES_WILL_BE_POSTED_ON_THIS_PAGE_WITH_AN_UPDATED_"EFFECTIVE_DATE."
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">CONTACT_US</h2>
              <p className="text-gray-300 font-mono uppercase">
                IF_YOU_HAVE_ANY_QUESTIONS_ABOUT_THIS_COOKIES_POLICY,_PLEASE_CONTACT_US:
              </p>
              <ul className="mt-2 text-gray-300 font-mono uppercase">
                <li><strong>EMAIL:</strong> ADMIN@ALGOZ.TECH</li>
                <li><strong>PHONE:</strong> +91_9214740350</li>
              </ul>
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