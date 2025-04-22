import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/hero5-header'
import BackButton from '@/components/back-button'

export default function PrivacyPolicy() {
  return (
    <>
      <HeroHeader />
      <div className="bg-black min-h-screen">
        <BackButton />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8 font-mono uppercase">PRIVACY_POLICY</h1>
          
          <div className="max-w-none">
            <section className="mb-8">
              <p className="text-gray-300 font-mono uppercase">
                AT_ALGOZ_WE_VALUE_YOUR_PRIVACY_AND_ARE_COMMITTED_TO_PROTECTING_YOUR_PERSONAL_DATA._THIS_PRIVACY_POLICY_EXPLAINS_HOW_WE_COLLECT_USE_PROCESS_AND_STORE_YOUR_INFORMATION_WHEN_YOU_USE_OUR_ALGORITHMIC_TRADING_PLATFORM_AND_SERVICES.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                BY_USING_OUR_SERVICES_YOU_AGREE_TO_THE_COLLECTION_AND_USE_OF_YOUR_INFORMATION_IN_ACCORDANCE_WITH_THIS_POLICY._PLEASE_READ_THIS_PRIVACY_POLICY_CAREFULLY_TO_UNDERSTAND_OUR_PRACTICES_REGARDING_YOUR_PERSONAL_DATA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">INFORMATION_WE_COLLECT</h2>
              <p className="text-gray-300 font-mono uppercase">
                WE_COLLECT_SEVERAL_TYPES_OF_INFORMATION_FOR_VARIOUS_PURPOSES_TO_PROVIDE_AND_IMPROVE_OUR_SERVICES_TO_YOU:
              </p>
              <h3 className="text-xl font-semibold text-white mt-6 mb-2 font-mono uppercase">PERSONAL_DATA</h3>
              <ul className="list-disc pl-6 text-gray-300 font-mono uppercase">
                <li>IDENTITY_INFORMATION:_NAME_USERNAME_PROFILE_PICTURE</li>
                <li>CONTACT_INFORMATION:_EMAIL_ADDRESS_PHONE_NUMBER</li>
                <li>FINANCIAL_INFORMATION:_PAYMENT_DETAILS_TRANSACTION_HISTORY</li>
                <li>TECHNICAL_INFORMATION:_IP_ADDRESS_BROWSER_TYPE_DEVICE_INFORMATION</li>
                <li>USAGE_DATA:_HOW_YOU_INTERACT_WITH_OUR_PLATFORM_FEATURES_USED_TRADING_ACTIVITY</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-2 font-mono uppercase">COOKIES_AND_TRACKING_DATA</h3>
              <p className="text-gray-300 font-mono uppercase">
                WE_USE_COOKIES_AND_SIMILAR_TRACKING_TECHNOLOGIES_TO_TRACK_ACTIVITY_ON_OUR_PLATFORM_AND_HOLD_CERTAIN_INFORMATION._YOU_CAN_INSTRUCT_YOUR_BROWSER_TO_REFUSE_ALL_COOKIES_OR_TO_INDICATE_WHEN_A_COOKIE_IS_BEING_SENT._HOWEVER_IF_YOU_DO_NOT_ACCEPT_COOKIES_YOU_MAY_NOT_BE_ABLE_TO_USE_SOME_PORTIONS_OF_OUR_SERVICE._FOR_MORE_INFORMATION_PLEASE_SEE_OUR <Link href="/cookies-policy" className="text-blue-400 hover:text-blue-300 font-mono uppercase">COOKIES_POLICY</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">HOW_WE_USE_YOUR_INFORMATION</h2>
              <p className="text-gray-300 font-mono uppercase">
                WE_USE_THE_COLLECTED_DATA_FOR_VARIOUS_PURPOSES:
              </p>
              <ul className="list-disc pl-6 text-gray-300 font-mono uppercase">
                <li>TO_PROVIDE_AND_MAINTAIN_OUR_SERVICES</li>
                <li>TO_NOTIFY_YOU_ABOUT_CHANGES_TO_OUR_SERVICES</li>
                <li>TO_PROVIDE_CUSTOMER_SUPPORT</li>
                <li>TO_GATHER_ANALYSIS_OR_VALUABLE_INFORMATION_SO_THAT_WE_CAN_IMPROVE_OUR_SERVICES</li>
                <li>TO_MONITOR_THE_USAGE_OF_OUR_SERVICES</li>
                <li>TO_DETECT_PREVENT_AND_ADDRESS_TECHNICAL_ISSUES</li>
                <li>TO_PROVIDE_YOU_WITH_NEWS_SPECIAL_OFFERS_AND_GENERAL_INFORMATION_ABOUT_OTHER_GOODS_SERVICES_AND_EVENTS</li>
                <li>TO_COMPLY_WITH_LEGAL_OBLIGATIONS</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">DATA_SECURITY</h2>
              <p className="text-gray-300 font-mono uppercase">
                THE_SECURITY_OF_YOUR_DATA_IS_IMPORTANT_TO_US._WE_STRIVE_TO_USE_COMMERCIALLY_ACCEPTABLE_MEANS_TO_PROTECT_YOUR_PERSONAL_DATA_BUT_REMEMBER_THAT_NO_METHOD_OF_TRANSMISSION_OVER_THE_INTERNET_OR_METHOD_OF_ELECTRONIC_STORAGE_IS_100%_SECURE._WHILE_WE_STRIVE_TO_USE_COMMERCIALLY_ACCEPTABLE_MEANS_TO_PROTECT_YOUR_PERSONAL_DATA_WE_CANNOT_GUARANTEE_ITS_ABSOLUTE_SECURITY.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">DATA_RETENTION</h2>
              <p className="text-gray-300 font-mono uppercase">
                WE_WILL_RETAIN_YOUR_PERSONAL_DATA_ONLY_FOR_AS_LONG_AS_NECESSARY_FOR_THE_PURPOSES_SET_OUT_IN_THIS_PRIVACY_POLICY._WE_WILL_RETAIN_AND_USE_YOUR_PERSONAL_DATA_TO_THE_EXTENT_NECESSARY_TO_COMPLY_WITH_OUR_LEGAL_OBLIGATIONS_RESOLVE_DISPUTES_AND_ENFORCE_OUR_LEGAL_AGREEMENTS_AND_POLICIES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">DISCLOSURE_OF_DATA</h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-2 font-mono uppercase">LEGAL_REQUIREMENTS</h3>
              <p className="text-gray-300 font-mono uppercase">
                WE_MAY_DISCLOSE_YOUR_PERSONAL_DATA_IN_THE_GOOD_FAITH_BELIEF_THAT_SUCH_ACTION_IS_NECESSARY_TO:
              </p>
              <ul className="list-disc pl-6 text-gray-300 font-mono uppercase">
                <li>COMPLY_WITH_A_LEGAL_OBLIGATION</li>
                <li>PROTECT_AND_DEFEND_THE_RIGHTS_OR_PROPERTY_OF_ALGOZ</li>
                <li>PREVENT_OR_INVESTIGATE_POSSIBLE_WRONGDOING_IN_CONNECTION_WITH_THE_SERVICE</li>
                <li>PROTECT_THE_PERSONAL_SAFETY_OF_USERS_OF_THE_SERVICE_OR_THE_PUBLIC</li>
                <li>PROTECT_AGAINST_LEGAL_LIABILITY</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-2 font-mono uppercase">SERVICE_PROVIDERS</h3>
              <p className="text-gray-300 font-mono uppercase">
                WE_MAY_EMPLOY_THIRD-PARTY_COMPANIES_AND_INDIVIDUALS_TO_FACILITATE_OUR_SERVICE_PROVIDE_THE_SERVICE_ON_OUR_BEHALF_PERFORM_SERVICE-RELATED_SERVICES_OR_ASSIST_US_IN_ANALYZING_HOW_OUR_SERVICE_IS_USED._THESE_THIRD_PARTIES_HAVE_ACCESS_TO_YOUR_PERSONAL_DATA_ONLY_TO_PERFORM_THESE_TASKS_ON_OUR_BEHALF_AND_ARE_OBLIGATED_NOT_TO_DISCLOSE_OR_USE_IT_FOR_ANY_OTHER_PURPOSE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">YOUR_DATA_PROTECTION_RIGHTS</h2>
              <p className="text-gray-300 font-mono uppercase">
                YOU_HAVE_THE_FOLLOWING_DATA_PROTECTION_RIGHTS:
              </p>
              <ul className="list-disc pl-6 text-gray-300 font-mono uppercase">
                <li><strong>ACCESS:</strong> YOU_CAN_REQUEST_COPIES_OF_YOUR_PERSONAL_DATA.</li>
                <li><strong>RECTIFICATION:</strong> YOU_CAN_REQUEST_THAT_WE_CORRECT_ANY_INFORMATION_YOU_BELIEVE_IS_INACCURATE_OR_COMPLETE_INFORMATION_YOU_BELIEVE_IS_INCOMPLETE.</li>
                <li><strong>ERASURE:</strong> YOU_CAN_REQUEST_THAT_WE_ERASE_YOUR_PERSONAL_DATA_UNDER_CERTAIN_CONDITIONS.</li>
                <li><strong>RESTRICTION:</strong> YOU_CAN_REQUEST_THAT_WE_RESTRICT_THE_PROCESSING_OF_YOUR_PERSONAL_DATA_UNDER_CERTAIN_CONDITIONS.</li>
                <li><strong>DATA_PORTABILITY:</strong> YOU_CAN_REQUEST_THAT_WE_TRANSFER_THE_DATA_WE_HAVE_COLLECTED_TO_ANOTHER_ORGANIZATION_OR_DIRECTLY_TO_YOU_UNDER_CERTAIN_CONDITIONS.</li>
              </ul>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                TO_EXERCISE_ANY_OF_THESE_RIGHTS_PLEASE_CONTACT_US_USING_THE_INFORMATION_IN_THE_"CONTACT_US"_SECTION.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">CHANGES_TO_THIS_PRIVACY_POLICY</h2>
              <p className="text-gray-300 font-mono uppercase">
                WE_MAY_UPDATE_OUR_PRIVACY_POLICY_FROM_TIME_TO_TIME._WE_WILL_NOTIFY_YOU_OF_ANY_CHANGES_BY_POSTING_THE_NEW_PRIVACY_POLICY_ON_THIS_PAGE_AND_UPDATING_THE_"LAST_UPDATED"_DATE_AT_THE_TOP_OF_THIS_PRIVACY_POLICY.
              </p>
              <p className="text-gray-300 mt-4 font-mono uppercase">
                YOU_ARE_ADVISED_TO_REVIEW_THIS_PRIVACY_POLICY_PERIODICALLY_FOR_ANY_CHANGES._CHANGES_TO_THIS_PRIVACY_POLICY_ARE_EFFECTIVE_WHEN_THEY_ARE_POSTED_ON_THIS_PAGE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 font-mono uppercase">CONTACT_US</h2>
              <p className="text-gray-300 font-mono uppercase">
                IF_YOU_HAVE_ANY_QUESTIONS_ABOUT_THIS_PRIVACY_POLICY_PLEASE_CONTACT_US:
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