FactoryBot.define do
  factory :graduation_record do
    association :student
    graduation_date     { Date.today }
    dossier_status      { "compiling" }
    transfer_destination { "Nifas Silk-Lafto Sub-City" }
    dossier_contents    { {} }

    trait :ready do
      dossier_status { "ready" }
    end

    trait :transferred do
      dossier_status { "transferred" }
    end
  end
end
